import React, { useState, useRef, useMemo, useEffect } from "react"
import {Some, Maybe} from "monet"
import { createQrReader, IResult } from "./qrReading/reader"
import mockImageSuccess from './mockImages/success.png';
import mockImageFailure from './mockImages/failure.png';
import { EventEmitter } from "events";

type ICanvasState = {width: number, height: number}

/* eslint-disable */

const mediaReady = (mediaElm: HTMLVideoElement | HTMLImageElement) =>
	"readyState" in mediaElm ?
		mediaElm.readyState === mediaElm.HAVE_ENOUGH_DATA :
		mediaElm.complete && mediaElm.naturalWidth > 0

const renderImages = (refs: React.RefObject<HTMLImageElement>[], imgs: string[]) =>
	imgs.map((src, i) => <img src={src} ref={refs[i]} key={i} style={{display: "none"}} />)

const polygonPath = (polygon: {x: number, y: number}[]) =>
	"M" + [...polygon, polygon[0]].map(({x, y}) => `${x},${y} `).join()

export const ReadQr = ({useMockImage}: {useMockImage: boolean}) => Some({
		stateThings: useState<"INIT" | "WAIT" | "FAILED" | "STREAMING">("INIT"),
		dataState: useState<IResult | false>(false),
		videoRef: useRef<HTMLVideoElement>(null),
		canvasRef: useRef<HTMLCanvasElement>(null),
		mockStatePair: useState(Math.floor(Math.random() * 1.99)),
		imageRefs: [useRef<HTMLImageElement>(null), useRef<HTMLImageElement>(null)],
		canvasEvents: useMemo(() => new EventEmitter(), []),
	}).map(({dataState: [dataState, setDataState], ...rest}) => ({
		qrReader: useMemo(() => createQrReader(setDataState), [createQrReader]),
		dataState,
		...rest,
	})).map(({videoRef, canvasRef, imageRefs, mockStatePair: [mockState], qrReader, canvasEvents, ...rest}) => ({
		registerMediaStreamAndAnimSeq: React.useEffect(() => {
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
							ctx.lineWidth = 3
							ctx.lineCap = "round"
							ctx.strokeStyle = "rgb(255, 0, 0, 0.5)"
							canvasEvents.emit("ctx", ctx)
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
		unsubscribe: React.useEffect(() => () => qrReader.unsubscribe(), []),
		paintPolygon: useEffect(() => Maybe.fromFalsy((ctx: CanvasRenderingContext2D) => {
				if (!(rest.dataState && rest.dataState.polygon?.length))
					return
				const polygon = rest.dataState.polygon
				// console.log(pathSpec)
				const path = new Path2D(polygonPath(polygon))
				ctx.stroke(path)
			})
			.map(onCanvasFunc => {
				canvasEvents.on("ctx", onCanvasFunc)
				return () => {canvasEvents.removeListener("ctx", onCanvasFunc)}
			})
			.some(), [rest.dataState && polygonPath(rest.dataState.polygon)]),
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
				<span>Reader, state: {state}, timeout: {dataState && dataState.timeout}</span>
				{dataState && <span>Customer: {dataState.data.customer}, Fraction: {dataState.data.fraction}</span>}
			</div>).some()
