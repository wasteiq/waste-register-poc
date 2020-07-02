import React, { useState, useRef } from "react"
import {Some, Maybe} from "monet"

type ICanvasState = {width: number, height: number}

const canvasStateAsString = (canvasState: ICanvasState, onlyDimensions = true) =>
	Some(onlyDimensions ? (({width, height} : ICanvasState) => ({width, height}))(canvasState) : canvasState)
		.map(o => JSON.stringify(o))

/* eslint-disable */

export const ReadQr = () => Some({
		stateThings: useState<"LOADING" | "FAILED" | "STREAMING">("LOADING"),
		canvasState: useState({width: 800, height: 600}),
		videoRef: useRef<HTMLVideoElement>(null),
		canvasRef: useRef<HTMLCanvasElement>(null),
		animRef: useRef<number>(0),
	}).map(({animRef, videoRef, canvasRef, canvasState: [canvasSize, setCanvasSize], ...rest}) => ({
		nothing: React.useEffect(() => {
			if (videoRef.current == null || canvasRef.current == null) {
				throw new Error("This handling is here because of strict mode, the variable defs below as well")
			}
			const videoElm = videoRef.current
			const canvasElm = canvasRef.current
			const newCanvasState = {width: videoElm.videoWidth, height: videoElm.videoHeight}
			if (canvasStateAsString(canvasSize, false) === canvasStateAsString(newCanvasState, false)) {
				setCanvasSize(newCanvasState)
			}
			const animate = () => {
				if (videoElm.readyState === videoElm.HAVE_ENOUGH_DATA) {
					Maybe.fromFalsy(canvasElm.getContext("2d")).
						forEach(ctx => {
							ctx.drawImage(videoElm, 0, 0, canvasSize.width, canvasSize.height);
						})
					
/*					var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
					var code = jsQR(imageData.data, imageData.width, imageData.height, {
					  inversionAttempts: "dontInvert",
					});
					if (code) {
					  drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
					  drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
					  drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
					  drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
					  outputMessage.hidden = true;
					  outputData.parentElement.hidden = false;
					  outputData.innerText = code.data;
					} else {
					  outputMessage.hidden = false;
					  outputData.parentElement.hidden = true;
					} */
				  }
				  requestAnimationFrame(animate);
			}
			if (rest.stateThings[0] === "LOADING") {
				Promise.resolve(true).then(() =>
					navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
						videoElm.srcObject = stream;
						videoElm.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
						videoElm.play();
						animRef.current = requestAnimationFrame(animate);
						rest.stateThings[1]("STREAMING")
					})).catch(err => {
						rest.stateThings[1]("FAILED")
					})
			}
		  
			return () => animRef.current && cancelAnimationFrame(animRef.current) || undefined;
		  }, [canvasStateAsString(canvasSize)]),
		...rest,
		videoRef,
		canvasRef,
		canvasSize,
	})).
	map(({stateThings: [state, setState], videoRef, canvasRef, canvasSize}) => 
		state === "FAILED" ?
			<div style={{color: "orange", margin: "2em"}}>🎥 Unable to access video stream (please make sure you have a webcam enabled)</div> :
			<div style={{display: "flex", flexDirection: "column"}}>
				<video ref={videoRef} style={{display: "none"}} />
				{ /* Insane error here: used style (CSS) width/height, instead of plain w/h.  This led to some crazy scaling that was impossible to understand.  Look up "300x150" for an explanation. */ }
				<canvas ref={canvasRef} width={`${canvasSize.width}px`} height={`${canvasSize.height}px`} />
				<span>hello read! {state}</span>
			</div>).some()