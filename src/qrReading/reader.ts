import jsQr from 'jsqr'
import {QRCode} from 'jsqr'
import {Subject} from 'rxjs'
import {map} from 'rxjs/operators/index'
import { Some, Maybe } from 'monet';

export const createQrReader = (onResults: (timeout: number, data?: any, polygon?: {x: number, y: number}[]) => void) =>
	Some(new Subject<ImageData>())
	.map(subject$ => ({
		subject$,
		parses$: subject$.pipe(
			map(imageData => Maybe.fromFalsy(jsQr(imageData.data, imageData.width, imageData.height, {
					inversionAttempts: "dontInvert",
				}))
				.map(code => ({status: "HIT", code})) //<{status: "HIT", code: QRCode} | {status: "NO_HIT"}>
			))
			// .catchMap(() => Some({status: "NO_HIT"})))))
	}))
	.map(({subject$, parses$}) => ({
		readerInterface: {
			addFrame: (imageData: ImageData) => subject$.next(imageData)
		},
		parses$
	}))
	.map(({parses$, readerInterface}) => {
		const subscription = parses$.subscribe(hitMaybe => 
			hitMaybe.map(({code} : {code: QRCode}) => (onResults(3, code.data, [
				code.location.topLeftCorner,
				code.location.topRightCorner,
				code.location.bottomRightCorner,
				code.location.bottomLeftCorner,
			]), true)).catchMap(() => (onResults(-1), Maybe.Some(true)))
		)
		return {
			...readerInterface,
			unsubscribe: () => subscription.unsubscribe()
		}
	})
.some()
