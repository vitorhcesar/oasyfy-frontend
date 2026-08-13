/* global self, clients */

self.addEventListener("push", (event) => {
  let title = "Oasyfy";
  let options = {
    body: "Você tem uma nova atualização",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    lang: "pt-BR",
    data: { url: "/seller" },
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      title = payload.title || title;
      options = {
        ...options,
        body: payload.body || options.body,
        icon: payload.icon || options.icon,
        badge: payload.badge || options.badge,
        lang: payload.lang || options.lang,
        data: payload.data || options.data,
      };
    }
  } catch {
    // keep defaults
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/seller";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(targetUrl);
          }
          return;
        }
      }

      if (clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
    })(),
  );
});
