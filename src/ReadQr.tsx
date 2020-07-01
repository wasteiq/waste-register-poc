import React, { useState, useRef } from "react"
import {Some, Maybe} from "monet"

/* eslint-disable */

export const ReadQr = () => Some({
		stateThings: useState<"LOADING" | "FAILED" | "STREAMING">("LOADING"),
		canvasState: useState({width: 800, height: 600}),
		videoRef: useRef<HTMLVideoElement>(null),
		canvasRef: useRef<HTMLCanvasElement>(null),
		animRef: useRef<number>(0),
	}).map(({animRef, videoRef, canvasRef, canvasState: [canvasSize, setCanvasSize], ...rest}) => ({
		nothing: React.useEffect(() => {
			const animate = () => {
				// videoRef.current.
				if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
					const video = videoRef.current
					setCanvasSize({width: video.videoWidth, height: video.videoHeight})
					Maybe.fromFalsy(canvasRef.current.getContext("2d")).
						forEach(canvas => {
							canvas.drawImage(video, 0, 0, canvasSize.width, canvasSize.height);
/*							canvas.beginPath()
							canvas.moveTo(0, 0)
							canvas.lineTo(280, 145)
							canvas.lineWidth = 4;
      						canvas.strokeStyle = "#FF3B58";
							canvas.stroke() */
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
			navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
					videoRef.current.play();
					animRef.current = requestAnimationFrame(animate);	
				}
			});
		  
			return () => animRef.current && cancelAnimationFrame(animRef.current) || undefined;
		  }, [JSON.stringify(canvasSize)]),
		...rest,
		videoRef,
		canvasRef,
		canvasSize,
	})).
	map(({stateThings: [state, setState], videoRef, canvasRef, canvasSize}) => 
		state === "FAILED" ? <span>🎥 Unable to access video stream (please make sure you have a webcam enabled)</span> :
		<div style={{display: "flex", flexDirection: "column"}}>
			<video ref={videoRef} style={{display: "none"}} />
			{ /* Insane error here: used style (CSS) width/height, instead of plain w/h.  This led to some crazy scaling that was impossible to understand.  Look up "300x150" for an explanation. */ }
			<canvas ref={canvasRef} width={`${canvasSize.width}px`} height={`${canvasSize.height}px`} />
			<span>hello read! {state}</span>
		</div>).some()