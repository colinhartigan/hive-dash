import { useCallback, useEffect, useMemo, useState } from 'react';

import { useColorModeValue } from '@chakra-ui/react';

import dayjs from '@/lib/time';

import { PrintStates } from '@/util/states';

export default function usePrintProgress(printData) {
    const [trueProgress, setTrueProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timeLeftHumanized, setTimeLeftHumanized] = useState('');
    const [complete, setComplete] = useState(false);

    const eventsReversed = useMemo(() => {
        if (!printData) return [];
        return [...printData.events].reverse();
    }, [printData]);

    const queueTime = useMemo(() => {
        if (!printData) return null;
        return dayjs.utc(printData.queuedAt);
    }, [printData]);

    const startTime = useMemo(() => {
        if (!printData) return null;
        return dayjs.utc(eventsReversed.find((e) => e.type === PrintStates.PRINTING)?.timestamp);
    }, [printData, eventsReversed]);

    const completedTime = useMemo(() => {
        if (!printData) return null;
        return dayjs.utc(eventsReversed.find((e) => e.type === PrintStates.COMPLETED)?.timestamp);
    }, [printData, eventsReversed]);

    const failTime = useMemo(() => {
        if (!printData) return null;
        return dayjs.utc(eventsReversed.find((e) => e.type === PrintStates.FAILED)?.timestamp);
    }, [printData, eventsReversed]);

    const cancelTime = useMemo(() => {
        if (!printData) return null;
        return dayjs.utc(eventsReversed.find((e) => e.type === PrintStates.CANCELED)?.timestamp);
    }, [printData, eventsReversed]);

    const endTime = useMemo(() => {
        if (!startTime) return null;
        console.log(startTime);
        let end = startTime.add(dayjs.duration(printData.estTime));
        return end;
    }, [printData, startTime]);

    const update = useCallback(() => {
        if (printData.state === PrintStates.PRINTING) {
            const now = dayjs.utc();
            const total = endTime.diff(startTime);
            const elapsed = now.diff(startTime);
            const remaining = dayjs.duration(endTime.diff(now));

            const remainingToFormat = remaining.add({ minutes: 1 });
            const remainingHumanized = remaining.humanize(true);
            let remainingFormatted = remaining.format(remaining.get('days') > 0 ? 'D:HH:mm' : 'HH:mm');

            let progress = Math.floor((elapsed / total) * 100);

            if (remaining.asSeconds() <= 0) {
                setComplete(true);
                remainingFormatted = '00:00';
                progress = 99;
            } else {
                setComplete(false);
            }

            setTrueProgress(progress);
            setTimeLeft(remainingFormatted);
            setTimeLeftHumanized(remainingHumanized);
        } else if (printData.state === PrintStates.FAILED) {
            const elapsed = dayjs.duration(failTime.diff(dayjs.utc()));

            setComplete(false);
            setTrueProgress(100);
            setTimeLeft('00:00');
            setTimeLeftHumanized(elapsed.humanize(true));
        } else if (printData.state === PrintStates.QUEUED) {
            const elapsed = dayjs.duration(dayjs.utc(printData.queuedAt).diff(dayjs.utc()));

            setComplete(false);
            setTrueProgress(0);
            setTimeLeft('00:00');
            setTimeLeftHumanized(elapsed.humanize(true));
        } else if (printData.state === PrintStates.COMPLETED) {
            const elapsed = dayjs.duration(completedTime.diff(dayjs.utc()));

            setComplete(false);
            setTrueProgress(100);
            setTimeLeft('00:00');
            setTimeLeftHumanized(elapsed.humanize(true));
        } else if (printData.state === PrintStates.CANCELED) {
            const elapsed = dayjs.duration(cancelTime.diff(dayjs.utc()));

            setComplete(false);
            setTrueProgress(100);
            setTimeLeft('00:00');
            setTimeLeftHumanized(elapsed.humanize(true));
        }
    }, [startTime, endTime, failTime, printData, completedTime, cancelTime]);

    useEffect(() => {
        if (!printData) return;
        update();
        const interval = setInterval(() => {
            update();
        }, 1000);
        return () => clearInterval(interval);

        // } else {
        //     setTimeLeftHumanized('');
        //     setTrueProgress(0);
        //     setTimeLeft(0);
        //     setComplete(false);
        // }
    }, [update, printData]);

    const timeLeftHumanizedDetailed = useMemo(() => {
        if (!printData) return 'unknown';
        if (printData.state === PrintStates.FAILED) {
            return `failed ${timeLeftHumanized}`;
        } else if (complete && printData.state !== PrintStates.COMPLETED) {
            return `expected ${timeLeftHumanized}`;
        } else if (printData.state === PrintStates.COMPLETED) {
            return `completed ${timeLeftHumanized}`;
        } else if (printData.state === PrintStates.PRINTING) {
            return `expected ${timeLeftHumanized}`;
        } else if (printData.state === PrintStates.QUEUED) {
            return `queued ${timeLeftHumanized}`;
        } else if (printData.state === PrintStates.CANCELED) {
            return `canceled ${timeLeftHumanized}`;
        }
    }, [timeLeftHumanized, complete, printData]);

    const progress = useMemo(() => {
        if (!printData) return 0;
        return printData.state === PrintStates.FAILED ||
            printData.state === PrintStates.COMPLETED ||
            printData.state === PrintStates.CANCELED
            ? 100
            : trueProgress;
    }, [printData, trueProgress]);

    const progressBarColor = useMemo(() => {
        if (!printData) return 'gray';
        if (printData.state === PrintStates.FAILED || printData.state === PrintStates.CANCELED) {
            return 'red';
        } else if (printData.state === PrintStates.COMPLETED) {
            return 'green';
        } else if (complete) {
            return 'yellow';
        } else if (printData.state === PrintStates.PRINTING) {
            return 'blue';
        } else {
            return 'gray';
        }
    }, [printData, complete]);

    const progressMessageColor = useMemo(() => {
        if (!printData) return 'gray';
        if (printData.state === PrintStates.FAILED || printData.state === PrintStates.CANCELED) {
            return 'red';
        } else if (printData.state === PrintStates.COMPLETED) {
            return 'green';
        } else if (complete) {
            return 'yellow';
        } else if (printData.state === PrintStates.PRINTING) {
            return 'green';
        } else {
            return 'gray';
        }
    }, [printData, complete]);

    const progressMessage = useMemo(() => {
        if (!printData) return 'unknown';
        if (printData.state === PrintStates.FAILED) {
            return 'failed';
        } else if (printData.state === PrintStates.CANCELED) {
            return 'canceled';
        } else if (complete && printData.state !== PrintStates.COMPLETED) {
            return 'waiting';
        } else if (printData.state === PrintStates.COMPLETED) {
            return 'completed';
        } else if (printData.state === PrintStates.PRINTING) {
            return `printing`;
        } else if (printData.state === PrintStates.QUEUED) {
            return 'queued';
        }
    }, [complete, printData]);

    const progressCircleColor = useColorModeValue(`${progressBarColor}.500`, `${progressBarColor}.200`);

    return {
        progress,
        timeLeft,
        timeLeftHumanized,
        timeLeftHumanizedDetailed,
        complete,
        progressBarColor,
        progressCircleColor,
        progressMessage,
        progressMessageColor,
        startTime,
        queueTime
    };
}
