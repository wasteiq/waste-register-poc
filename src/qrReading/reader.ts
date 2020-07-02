export const createQrReader = (onResults: (timeout: number, data: any) => void) => ({
	addFrame: (imageData: any) => {
		console.log("got image data", imageData.width)
	},
})