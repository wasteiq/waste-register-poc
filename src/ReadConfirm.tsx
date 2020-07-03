import React, { useState, useEffect, useMemo } from 'react';
import { combineLatest, from } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { Some } from 'monet';

const loadRandom = 1500

const randomTimeout = () => Math.random() * loadRandom + 100

const lookupCustomer = (customerId: string) => new Promise<string>(acc => setTimeout(() => acc(customerId === "hm" ? "Hennes & Mauritz" : "Teknikmagasinet"), randomTimeout()))
const lookupFraction = (customerId: string) => new Promise<string>(acc => setTimeout(() => acc(customerId === "9999" ? "Residual waste" : "Paper"), randomTimeout()))

// Note: Some fractions might not exist on a given waste room, should warn the user that they need to throw elsewhere

/* eslint-disable react-hooks/rules-of-hooks */

interface IProps {customerId: string, fractionId: string, wasteRoomLabel: string}
export const ReadConfirm = ({customerId, fractionId, wasteRoomLabel}: IProps) => Some({
	statePairs: useState<{customerId?: string, fractionId?: string, customerName?: string, fractionLabel?: string}>({}),
	loader$: useMemo(() => combineLatest([
		from(Promise.resolve(customerId)),
		from(Promise.resolve(fractionId)),
		from(lookupCustomer(customerId)).pipe(startWith("loading...")),
		from(lookupFraction(fractionId)).pipe(startWith("loading...")),
	]), [customerId, fractionId])
})
.map(({statePairs: [state, setState], loader$}) => ({
	n: useEffect(() =>
		Some(loader$.subscribe(([customerId, fractionId, customerName, fractionLabel]) => 
				setState({customerId, fractionId, customerName, fractionLabel})))
			.cata(() => {}, subscription => () => subscription.unsubscribe()), [loader$, setState]),
	state
})).cata(() => <div/>, ({state: {customerId, customerName, fractionId, fractionLabel}}) =>
	<div style={{display: "flex", flexDirection: "column"}}>
		<div>{`Customer: ${customerName} (${customerId})`}</div>
		<div>{`Fraction: ${fractionLabel} (${fractionId})`}</div>
		<div>{`Waste Room: ${wasteRoomLabel}`}</div>
	</div>)
