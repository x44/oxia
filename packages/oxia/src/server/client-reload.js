function __ws__connect(reloadOnOpen) {
	const ws = new WebSocket(`ws://${location.host}`);

	ws.onopen = () => {
		// console.log("websocket opened");
		if (reloadOnOpen) {
			location.reload();
		}
	};

	ws.onclose = async () => {
		console.warn("websocket closed");
		await __ws__connect(true);
	};

	ws.onmessage = () => {
		location.reload();
	};
}

__ws__connect(false);
