import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.management.ManagementFactory;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;

public final class JarvisLocalBridge {
  private static final String HOST = "127.0.0.1";
  private static final int PORT = 8787;
  private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("h:mm a");
  private static final Set<String> ALLOWED_ORIGINS = Set.of(
      "null",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:8787",
      "http://127.0.0.1:8787",
      "https://adrielvent.github.io",
      "https://adrielvent.github.io/JARVIS/"
  );

  private JarvisLocalBridge() {
  }

  public static void main(String[] args) throws IOException {
    InetSocketAddress address = new InetSocketAddress(InetAddress.getByName(HOST), PORT);
    HttpServer server = HttpServer.create(address, 0);
    server.setExecutor(Executors.newCachedThreadPool());
    server.createContext("/", JarvisLocalBridge::handle);
    server.start();
    System.out.println("Project J.A.R.V.I.S. Java Local Bridge running at http://" + HOST + ":" + PORT);
    System.out.println("Use that Local Bridge URL in the J.A.R.V.I.S. web app. Press Ctrl+C to stop.");
  }

  private static void handle(HttpExchange exchange) throws IOException {
    addCors(exchange);
    String method = exchange.getRequestMethod();
    String path = exchange.getRequestURI().getPath();

    if ("OPTIONS".equalsIgnoreCase(method)) {
      send(exchange, 204, "");
      return;
    }

    if (!"GET".equalsIgnoreCase(method)) {
      sendJson(exchange, 404, Map.of("ok", false, "error", "unknown endpoint"));
      return;
    }

    if ("/status".equals(path)) {
      sendJson(exchange, 200, Map.of("status", "online"));
      return;
    }

    if ("/system-info".equals(path)) {
      sendJson(exchange, 200, systemInfo());
      return;
    }

    if ("/".equals(path)) {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("status", "online");
      payload.put("name", "Project J.A.R.V.I.S. Java Local Bridge");
      payload.put("bridgeUrl", "http://127.0.0.1:8787");
      payload.put("message", "Return to the J.A.R.V.I.S. website and connect to this local bridge.");
      sendJson(exchange, 200, payload);
      return;
    }

    sendJson(exchange, 404, Map.of("ok", false, "error", "unknown endpoint"));
  }

  private static Map<String, Object> systemInfo() {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("deviceName", deviceName());
    payload.put("os", System.getProperty("os.name", "Unknown") + " " + System.getProperty("os.version", ""));
    payload.put("cpu", cpuLabel());
    payload.put("memory", memoryLabel());
    payload.put("battery", "Unknown");
    payload.put("localTime", LocalTime.now().format(TIME_FORMAT));
    payload.put("status", "online");
    return payload;
  }

  private static String deviceName() {
    try {
      String hostName = InetAddress.getLocalHost().getHostName();
      if (hostName != null && !hostName.isBlank()) {
        return hostName;
      }
    } catch (IOException ignored) {
      // Fall through to the stable operator fallback.
    }
    return "Operator";
  }

  private static String cpuLabel() {
    String processor = System.getenv("PROCESSOR_IDENTIFIER");
    if (processor != null && !processor.isBlank()) {
      return processor;
    }
    String arch = System.getProperty("os.arch", "CPU");
    int cores = Runtime.getRuntime().availableProcessors();
    return arch + " (" + cores + " cores)";
  }

  private static String memoryLabel() {
    java.lang.management.OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    Long bytes = invokeLong(osBean, "getTotalMemorySize");
    if (bytes == null) {
      bytes = invokeLong(osBean, "getTotalPhysicalMemorySize");
    }
    if (bytes == null || bytes <= 0) {
      return "Unknown";
    }
    long gigabytes = Math.round(bytes / 1073741824.0);
    return gigabytes + " GB";
  }

  private static Long invokeLong(Object target, String methodName) {
    try {
      Object value = target.getClass().getMethod(methodName).invoke(target);
      if (value instanceof Number) {
        return ((Number) value).longValue();
      }
    } catch (ReflectiveOperationException | SecurityException ignored) {
      // Some JVMs do not expose physical memory; the API contract allows Unknown.
    }
    return null;
  }

  private static void addCors(HttpExchange exchange) {
    Headers responseHeaders = exchange.getResponseHeaders();
    String origin = exchange.getRequestHeaders().getFirst("Origin");
    if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
      responseHeaders.set("Access-Control-Allow-Origin", origin);
      responseHeaders.set("Vary", "Origin");
    }
    responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Accept, Content-Type");
    responseHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
  }

  private static void sendJson(HttpExchange exchange, int status, Map<String, ?> payload) throws IOException {
    exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
    send(exchange, status, toJson(payload));
  }

  private static void send(HttpExchange exchange, int status, String body) throws IOException {
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream output = exchange.getResponseBody()) {
      output.write(bytes);
    }
  }

  private static String toJson(Map<String, ?> payload) {
    StringBuilder json = new StringBuilder("{");
    boolean first = true;
    for (Map.Entry<String, ?> entry : payload.entrySet()) {
      if (!first) {
        json.append(',');
      }
      first = false;
      json.append('"').append(escape(entry.getKey())).append('"').append(':');
      Object value = entry.getValue();
      if (value instanceof Boolean || value instanceof Number) {
        json.append(value);
      } else {
        json.append('"').append(escape(String.valueOf(value))).append('"');
      }
    }
    json.append('}');
    return json.toString();
  }

  private static String escape(String value) {
    return value
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t");
  }
}
