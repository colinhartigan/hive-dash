import { useCallback, useEffect, useState } from 'react';

import {
    Box,
    Button,
    ButtonGroup,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Heading,
    Input,
    InputGroup,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Switch,
    Text,
    Textarea,
    VStack
} from '@chakra-ui/react';

import ChakraUIRenderer from 'chakra-ui-markdown-renderer';
import ReactMarkdown from 'react-markdown';

export default function MaintenanceModal({ isOpen, onClose, printerData }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            isCentered
            size="6xl"
            scrollBehavior="inside"
        >
            <ModalOverlay />
            <ModalContent h="container.sm">
                <ModalHeader>Maintenance notes - {printerData.displayName}</ModalHeader>
                <ModalBody>
                    <Box>
                        <ReactMarkdown
                            components={ChakraUIRenderer()}
                            skipHtml
                        >
                            {printerData.maintenance.notes}
                        </ReactMarkdown>
                    </Box>
                </ModalBody>
                <ModalFooter spacing={3}>
                    <HStack spacing={3}>
                        <Button onClick={onClose}>Close</Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
