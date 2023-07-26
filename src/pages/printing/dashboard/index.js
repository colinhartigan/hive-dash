import { useContext, useEffect, useMemo, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';

import { ArrowForwardIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import PrintingContext from '@/contexts/printing/PrintingContext';

import Layout from '@/layouts/printing/PrintingLayout';

import PrinterCard from '@/components/printing/dashboard/PrinterItem';

export default function Dashboard(props) {
    const { printers, queue } = useContext(PrintingContext);

    useEffect(() => {
        console.log(printers);
    }, [printers]);

    return (
        <>
            <Box
                h="100%"
                w="100%"
                overflow="auto"
                p={5}
            >
                <SimpleGrid
                    spacing={4}
                    columns={3}
                    w="100%"
                    h="auto"
                >
                    {printers.map((printer) => {
                        return (
                            <PrinterCard
                                key={printer.id}
                                data={printer}
                            />
                        );
                    })}
                </SimpleGrid>
            </Box>
        </>
    );
}

Dashboard.getLayout = (page) => <Layout>{page}</Layout>;
