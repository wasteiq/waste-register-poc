import React, { useState, useRef } from "react"
import {Some, Maybe} from "monet"

type ICanvasState = {width: number, height: number}

/* eslint-disable */

export const ReadQr = () => Some({
		stateThings: useState<"INIT" | "WAIT" | "FAILED" | "STREAMING">("INIT"),
		videoRef: useRef<HTMLVideoElement>(null),
		canvasRef: useRef<HTMLCanvasElement>(null),
		animRef: useRef<number>(0),
	}).map(({animRef, videoRef, canvasRef, ...rest}) => ({
		nothing: React.useEffect(() => {
			if (videoRef.current == null || canvasRef.current == null) {
				throw new Error("This handling is here because of strict mode, the variable defs below as well")
			}
			const videoElm = videoRef.current
			const canvasElm = canvasRef.current
			const animate = () => {
				if (videoElm.readyState === videoElm.HAVE_ENOUGH_DATA) {
					Maybe.fromFalsy(canvasElm.getContext("2d")).
						forEach(ctx => {
							ctx.drawImage(videoElm, 0, 0, canvasElm.width, canvasElm.height);
						})	
				}
				requestAnimationFrame(animate);
			}
			if (rest.stateThings[0] === "INIT") {
				rest.stateThings[1]("WAIT")
				Promise.resolve(true).then(() =>
					navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
						console.log("init")
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
		  }, []),
		...rest,
		videoRef,
		canvasRef,
	})).
	map(({stateThings: [state, setState], videoRef, canvasRef}) => 
		state === "FAILED" ?
			<div style={{color: "orange", margin: "2em"}}>🎥 Unable to access video stream (please make sure you have a webcam enabled)</div> :
			<div style={{display: "flex", flexDirection: "column"}}>
				<video ref={videoRef} style={{display: "none"}} />
				{ /* Insane error here: used style (CSS) width/height, instead of plain w/h.  This led to some crazy scaling that was impossible to understand.  Look up "300x150" for an explanation. 
					Note: Assumes 640x480 is same aspect as video stream, if this assumption fails, the result will be stretched */ }
				<canvas ref={canvasRef} width={`${640}px`} height={`${480}px`} />
				<span>hello read! {state}</span>
			</div>).some()
