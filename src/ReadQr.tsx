import React, { useState, useRef, useMemo } from "react"
import {Some, Maybe} from "monet"
import { createQrReader } from "./qrReading/reader"
import mockImageSuccess from './mockImages/success.png';
import mockImageFailure from './mockImages/failure.png';

type ICanvasState = {width: number, height: number}

/* eslint-disable */

const mediaReady = (mediaElm: HTMLVideoElement | HTMLImageElement) =>
	"readyState" in mediaElm ?
		mediaElm.readyState === mediaElm.HAVE_ENOUGH_DATA :
		mediaElm.complete && mediaElm.naturalWidth > 0

const renderImages = (refs: React.RefObject<HTMLImageElement>[], imgs: string[]) =>
	imgs.map((src, i) => <img src={src} ref={refs[i]} key={i} style={{display: "none"}} />)

export const ReadQr = ({useMockImage}: {useMockImage: boolean}) => Some({
		stateThings: useState<"INIT" | "WAIT" | "FAILED" | "STREAMING">("INIT"),
		dataState: useState<{timeout: Number, data?: any}>({timeout: -1}),
		videoRef: useRef<HTMLVideoElement>(null),
		canvasRef: useRef<HTMLCanvasElement>(null),
		mockStatePair: useState(Math.floor(Math.random() * 1.99)),
		imageRefs: [useRef<HTMLImageElement>(null), useRef<HTMLImageElement>(null)]
	}).map(({dataState: [dataState, setDataState], ...rest}) => ({
		qrReader: useMemo(() => createQrReader((timeout, data) => setDataState({timeout, data})), [createQrReader]),
		dataState,
		...rest,
	})).map(({videoRef, canvasRef, imageRefs, mockStatePair: [mockState], qrReader, ...rest}) => ({
		nothing: React.useEffect(() => {
			if (videoRef.current == null || canvasRef.current == null) {
				throw new Error("This handling is here because of strict mode, the variable defs below as well")
			}
			const videoElm = videoRef.current
			const canvasElm = canvasRef.current
			let animRequest = 0
			const reqAnim = () => animRequest = requestAnimationFrame(animate)
			const animate = () => {
				const mediaSource = useMockImage ? imageRefs[mockState].current || videoElm : videoElm
				if (mediaReady(mediaSource)) {
					Maybe.fromFalsy(canvasElm.getContext("2d")).
						forEach(ctx => {
							ctx.drawImage(mediaSource, 0, 0, canvasElm.width, canvasElm.height);
							qrReader.addFrame(ctx.getImageData(0, 0, canvasElm.width, canvasElm.height))
						})
				}
				reqAnim()
			}
			rest.stateThings[1]("WAIT")
			Promise.resolve(true).then(() =>
				(useMockImage ? Promise.resolve(true) : navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
					videoElm.srcObject = stream;
					videoElm.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
					videoElm.play();
					return true
				})).then(() => {
					reqAnim()
					rest.stateThings[1]("STREAMING")
				})).catch(err => {
					rest.stateThings[1]("FAILED")
				})
		  
			return () => animRequest && cancelAnimationFrame(animRequest) || undefined;
		  }, []),
		...rest,
		videoRef,
		canvasRef,
		imageRefs
	})).
	map(({stateThings: [state], videoRef, imageRefs, canvasRef, dataState}) => 
		state === "FAILED" ?
			<div style={{color: "orange", margin: "2em"}}>🎥 Unable to access video stream (please make sure you have a webcam enabled)</div> :
			<div style={{display: "flex", flexDirection: "column"}}>
				<video ref={videoRef} style={{display: "none"}} />
				{useMockImage && renderImages(imageRefs, [mockImageSuccess, mockImageFailure])}
				{ /* Insane error here: used style (CSS) width/height, instead of plain w/h.  This led to some crazy scaling that was impossible to understand.  Look up "300x150" for an explanation. 
					Note: Assumes 640x480 is same aspect as video stream, if this assumption fails, the result will be stretched */ }
				<canvas ref={canvasRef} width={`${640}px`} height={`${480}px`} />
				<span>Reader, state: {state}, timeout: {dataState.timeout}</span>
			</div>).some()
