function __ws__connect(reloadOnOpen) {
	const ws = new WebSocket(`ws://${location.host}`);

	ws.onopen = () => {
		if (reloadOnOpen) {
			location.reload();
		}
	};

	ws.onclose = async () => {
		console.warn("websocket closed");
		await __ws__connect(true);
	};

	ws.onmessage = (msg) => {
		const { routes } = payload = JSON.parse(msg.data);
		if (routes.includes(location.pathname)) {
			location.reload();
		}
	};
}

__ws__connect(false);
