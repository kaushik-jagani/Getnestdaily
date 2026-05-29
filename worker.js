export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Redirect www → non-www
    if (url.hostname === "www.getnestdaily.xyz") {
      return Response.redirect(
        `https://getnestdaily.xyz${url.pathname}${url.search}`,
        301
      );
    }

    // Redirect /index.html
    if (url.pathname === "/index.html") {
      return Response.redirect(
        "https://getnestdaily.xyz/",
        301
      );
    }

    // Force HTTPS
    if (url.protocol === "http:") {
      return Response.redirect(
        `https://${url.hostname}${url.pathname}${url.search}`,
        301
      );
    }

    // Fetch the response
    const response = await fetch(request);

    return response;
  }

    return response;
  }
}
