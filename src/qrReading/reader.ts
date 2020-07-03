import jsQr, { QRCode } from 'jsqr'
import {Subject, combineLatest, interval} from 'rxjs'
import {map, scan, filter} from 'rxjs/operators/index'
import { Some, Maybe } from 'monet';

/* eslint-disable @typescript-eslint/consistent-type-assertions */

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
interface IMatchStats {firstMatch: number, lastMatch: number, match: IPrelimResult | null}

/* Used as accumulator with scan to keep matches a short while after the algorithm ceases to see the code. This is useful to with a countdown. */
export const keepLastHitWhenCloseInTime = (timeout: number, rightNow = () => +new Date()) =>
	(acc: IMatchStats, matchMaybe: Maybe<IPrelimResult>) => matchMaybe
	.map(match => ({
		firstMatch: acc.firstMatch > 0 ? acc.firstMatch : match.matchTime,
		lastMatch: match.matchTime,
		match: <IPrelimResult | null>match,
	}))
	.catchMap((now = rightNow()) => acc.lastMatch > now - timeout ?
		Maybe.Some(acc) : Maybe.some({firstMatch: -1, lastMatch: -1, match: null}))
	.some()

// Note: invalid urls, not matching the regex, will not be detected by the scanner at all

export const createQrReader = (onResults: (result: IResultOptions) => void) =>
	Some(new Subject<ImageData>())
	.map(subject$ => ({
		subject$,
		parses$: combineLatest([subject$.pipe(
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
				scan(keepLastHitWhenCloseInTime(500), {firstMatch: -1, lastMatch: -1, match: <IPrelimResult | null>null})
			),
			interval(200)
		]).pipe(
			map(([a, _t]) => a.firstMatch > 0 ? {...a, timeout: Math.max(0, Math.round((a.firstMatch + 5000 - +new Date()) / 1000))} : {...a, timeout: -1}),
			scan<IMatchStats & {timeout: number} & {duplicate?: boolean}>((acc, val) => ({...val, duplicate: acc.timeout === val.timeout})),
			filter(val => !val.duplicate)
		)
//			merge(x))
	}))
	.map(({subject$, parses$}) => ({
		readerInterface: {
			addFrame: (imageData: ImageData) => subject$.next(imageData)
		},
		parses$
	}))
	.map(({parses$, readerInterface}) => {
		const subscription = parses$.subscribe(({match, timeout}) => match ?
			(({code, customer, fraction}: IPrelimResult) => onResults({
				timeout,
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
