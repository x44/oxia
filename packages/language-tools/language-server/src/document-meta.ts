export type DocumentMeta = {
	styleBlockRanges: DocumentRange[];

	cssCurlyRanges: DocumentRange[];
	cssCurlyOpenPositions: number[];
	cssCurlyClosePositions: number[];
}

export type DocumentRange = {
	start: number;
	end: number;
}

export class DocumentMetas {
	/** Key: fileId (slashified fileName) */
	private static map = new Map<string, DocumentMeta>();

	static reset(fileId: string) {
		const meta = DocumentMetas.map.get(fileId);
		if (!meta) return;
		meta.styleBlockRanges.length = 0;
		meta.cssCurlyRanges.length = 0;
		meta.cssCurlyOpenPositions.length = 0;
		meta.cssCurlyClosePositions.length = 0;
	}

	static setCssCurlyPositions(fileId: string, cssCurlyOpenPositions: number[], cssCurlyClosePositions: number[]) {
		const meta = DocumentMetas.getOrAdd(fileId);

		for (let i = 0; i < cssCurlyOpenPositions.length; ++i) {
			meta.cssCurlyRanges.push({
				start: cssCurlyOpenPositions[i],
				end: cssCurlyClosePositions[i] + 1,
			});
		}
		meta.cssCurlyOpenPositions = [...cssCurlyOpenPositions];
		meta.cssCurlyClosePositions = [...cssCurlyClosePositions];
	}

	static hasCssCurlyPositions(fileId: string) {
		const meta = DocumentMetas.map.get(fileId);
		if (!meta) return false;
		return meta.cssCurlyOpenPositions.length > 0;
	}

	static isOffsetInCssCurlyRange(fileId: string, offset: number) {
		const meta = DocumentMetas.map.get(fileId);
		if (!meta) return false;
		for (let i = 0; i < meta.cssCurlyRanges.length; ++i) {
			const range = meta.cssCurlyRanges[i];
			if (offset >= range.start && offset < range.end) {
				return true;
			}
		}
		return false;
	}

	static isOffsetAtCssCurlyOpenPosition(fileId: string, offset: number) {
		const meta = DocumentMetas.map.get(fileId);
		if (!meta) return false;
		return meta.cssCurlyOpenPositions.includes(offset);
	}

	static isOffsetAtCssCurlyClosePosition(fileId: string, offset: number) {
		const meta = DocumentMetas.map.get(fileId);
		if (!meta) return false;
		return meta.cssCurlyClosePositions.includes(offset);
	}

	static addStyleBlockRange(fileId: string, start: number, end: number) {
		const meta = DocumentMetas.getOrAdd(fileId);
		meta.styleBlockRanges.push({
			start,
			end,
		});
	}

	static isOffsetInStyleBlockRange(fileId: string, offset: number) {
		const meta = DocumentMetas.map.get(fileId);
		if (!meta) return false;
		for (let i = 0; i < meta.styleBlockRanges.length; ++i) {
			const range = meta.styleBlockRanges[i];
			if (offset >= range.start && offset < range.end) {
				return true;
			}
		}
		return false;
	}

	static isOffsetAtStyleBlockStart(fileId: string, offset: number) {
		const meta = DocumentMetas.map.get(fileId);
		if (!meta) return false;
		for (let i = 0; i < meta.styleBlockRanges.length; ++i) {
			const range = meta.styleBlockRanges[i];
			if (offset === range.start - 1) {
				return true;
			}
		}
		return false;
	}

	private static getOrAdd(fileId: string) {
		let meta = DocumentMetas.map.get(fileId);
		if (!meta) {
			DocumentMetas.map.set(fileId, meta = {
				styleBlockRanges: [],
				cssCurlyRanges: [],
				cssCurlyOpenPositions: [],
				cssCurlyClosePositions: [],
			});
		}
		return meta;
	}

	static uri2fileId(uri: string) {
		let dec = uri.substring(uri.lastIndexOf("/") + 1);
		let tmp;
		while ((tmp = decodeURIComponent(dec)) !== dec) {
			dec = tmp;
		}
		return dec.substring(8);
	}
}
