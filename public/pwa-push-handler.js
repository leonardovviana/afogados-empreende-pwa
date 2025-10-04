self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (error) {
    console.error("[PWA] Não foi possível interpretar o payload do push:", error);
    return;
  }

  const notificationPayload = payload?.notification ?? {};
  const {
    title = "Atualização disponível",
    body = "Há novidades no seu cadastro.",
    icon = "/icon-192.png",
    badge = "/icon-192.png",
    data = {},
    tag,
    actions,
    requireInteraction,
  } = notificationPayload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data,
      tag,
      actions,
      requireInteraction,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url ?? "/consulta";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const focusedClient = clients.find((client) => {
        return client.url.includes(targetUrl) && "focus" in client;
      });

      if (focusedClient) {
        return focusedClient.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
