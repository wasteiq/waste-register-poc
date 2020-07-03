import jsQr, { QRCode } from 'jsqr'
import {Subject} from 'rxjs'
import {map, scan} from 'rxjs/operators/index'
import { Some, Maybe } from 'monet';

export interface IResult {
	timeout: number,
	data: {customer: string, fraction: string}
	polygon: {x: number, y: number}[]
}

type IResultOptions = IResult | false

interface IPrelimResult {
	code: QRCode
	customer: string
	fraction: string
	matchTime: number
}

/* Used as accumulator with scan to keep matches a short while after the algorithm ceases to see the code. This is useful to with a countdown. */
export const keepLastHitWhenCloseInTime = (timeout: number, rightNow = () => +new Date()) =>
	(acc: {firstMatch: number, lastMatch: number, match: IPrelimResult | null}, matchMaybe: Maybe<IPrelimResult>) => matchMaybe
	.map(match => ({
		firstMatch: acc.firstMatch > 0 ? acc.firstMatch : match.matchTime,
		lastMatch: match.matchTime,
		match: <IPrelimResult | null>match,
	}))
	.catchMap((now = rightNow()) => acc.lastMatch > now - timeout ?
		Maybe.Some(acc) : Maybe.some({firstMatch: -1, lastMatch: -1, match: null}))
	.some()

export const createQrReader = (onResults: (result: IResultOptions) => void) =>
	Some(new Subject<ImageData>())
	.map(subject$ => ({
		subject$,
		parses$: subject$.pipe(
			map(imageData => Maybe.fromFalsy(jsQr(imageData.data, imageData.width, imageData.height, {
					inversionAttempts: "dontInvert",
				}))
				.map(code => ({code, regex: /https:\/\/.*qrident\/([^/]+)\/([^/]+)/.exec(code.data)}))
				.flatMap(({code, regex}) => Maybe.fromFalsy(regex)
					.map(regex => ({code, regex}))) // filter does not work due to typing of regex
				.map(({code, regex}) => <IPrelimResult>{
					code,
					customer: regex[1],
					fraction: regex[2],
					matchTime: +new Date(),
				})
			),
			scan(keepLastHitWhenCloseInTime(500), {firstMatch: -1, lastMatch: -1, match: <IPrelimResult | null>null}))
//			merge(x))
	}))
	.map(({subject$, parses$}) => ({
		readerInterface: {
			addFrame: (imageData: ImageData) => subject$.next(imageData)
		},
		parses$
	}))
	.map(({parses$, readerInterface}) => {
		const subscription = parses$.subscribe(({match}) => match ?
			(({code, customer, fraction}: IPrelimResult) => onResults({
				timeout: 3,
				data: {customer, fraction},
				polygon: [
					code.location.topLeftCorner,
					code.location.topRightCorner,
					code.location.bottomRightCorner,
					code.location.bottomLeftCorner,
				]}))(match) : onResults(false)
		)
		return {
			...readerInterface,
			unsubscribe: () => subscription.unsubscribe()
		}
	})
.some()
