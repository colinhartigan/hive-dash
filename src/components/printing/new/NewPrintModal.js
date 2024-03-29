import { useCallback, useMemo, useState } from 'react';

import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Badge,
    Button,
    ButtonGroup,
    Card,
    CardBody,
    Divider,
    FormControl,
    FormLabel,
    HStack,
    Heading,
    Icon,
    Input,
    InputGroup,
    InputRightAddon,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spacer,
    Spinner,
    Step,
    StepIcon,
    StepIndicator,
    StepSeparator,
    StepStatus,
    Stepper,
    Text,
    VStack,
    useToast
} from '@chakra-ui/react';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Field, Form, Formik } from 'formik';

import { storage } from '@/lib/firebase';
import dayjs from '@/lib/time';

import usePrinting from '@/contexts/printing/PrintingContext';

import usePrinterParser from '@/hooks/printing/usePrinterParser';
import useRequest from '@/hooks/useRequest';

import iconSet from '@/util/icons';
import { PrintStates, StateColors } from '@/util/states';

import { Select } from '@/components/Select';
import STLInput from '@/components/printing/new/STLInput';

function PrinterItem({ printer, ...props }) {
    const { expandedPrinterData: printerData } = usePrinterParser(printer);
    const { queue } = usePrinting();

    const queueTime = useMemo(() => {
        let time = dayjs.duration(0, 'seconds');

        printerData.queue.forEach((job) => {
            const p = queue.find((p) => p._id === job);
            time = time.add(dayjs.duration(p.estTime));
        });

        // NOTE: could add a way to pad for closed time to make more accurate estimations
        if (time.asSeconds() > 10) {
            return time.humanize();
        } else {
            return 'none';
        }
    }, [printerData.queue, queue]);

    return (
        <Card
            {...props}
            variant="outline"
            bg="transparent"
            w="full"
            as={Button}
            h="auto"
            p={0}
            isDisabled={!printerData.enabled}
        >
            <CardBody
                p={4}
                w="full"
            >
                <VStack spacing={5}>
                    <HStack w="full">
                        <VStack
                            w="full"
                            align="start"
                        >
                            <HStack>
                                <Heading size="md">{printerData.displayName}</Heading>
                                {!printerData.enabled && (
                                    <Badge colorScheme={StateColors[printerData.state]}>{printerData.state}</Badge>
                                )}
                            </HStack>

                            <HStack
                                fontWeight="normal"
                                fontSize="md"
                                color="secondaryTextAlt"
                                spacing={2}
                                w="full"
                            >
                                <Icon as={iconSet.queue} />
                                <Text>{printerData.queueLength} prints in queue</Text>
                            </HStack>
                        </VStack>
                        <Spacer />

                        <VStack
                            align="end"
                            spacing={1}
                        >
                            <Text fontSize="3xl">{queueTime}</Text>
                            <HStack
                                fontSize="sm"
                                fontWeight="normal"
                                color="secondaryTextAlt"
                                spacing={2}
                            >
                                <Icon as={iconSet.clock} />
                                <Text>est wait</Text>
                            </HStack>
                        </VStack>
                    </HStack>
                </VStack>
            </CardBody>
        </Card>
    );
}

export default function NewPrintModal({ isOpen, onClose }) {
    const { printerTypes, printers, peerInstructors } = usePrinting();
    const request = useRequest();
    const toast = useToast();

    const [activeStep, setActiveStep] = useState(0);
    const [canContinue, setCanContinue] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('Submitting');

    const steps = useMemo(
        () => [
            {
                title: 'STL upload',
                checkComplete: (values) => {
                    return values?.stlFiles?.length > 0;
                }
            },
            {
                title: 'PI',
                checkComplete: (values) => {
                    return values?.pi?.value?.length > 0;
                }
            },
            {
                title: 'Printer type',
                checkComplete: (values) => {
                    console.log(values);
                    return values?.printerType?.id?.length > 0;
                }
            },
            {
                title: 'Printer',
                checkComplete: (values) => {
                    return values?.printer?.id?.length > 0;
                }
            },
            {
                title: 'End user',
                checkComplete: (values) => {
                    return values?.firstName?.length > 0 && values?.lastName?.length > 0 && values?.email?.length > 0;
                }
            },
            {
                title: 'Print info',
                checkComplete: (values) => {
                    console.log(values);
                    return (
                        values?.printName.length > 0 &&
                        values?.material?.value?.length > 0 &&
                        values?.materialUsage > 0 &&
                        (values?.estTimeHours != 0 || values?.estTimeMinutes != 0)
                    );
                }
            },
            {
                title: 'Submitting'
            },
            {
                title: 'Submitted'
            }
        ],
        []
    );

    const uploadFiles = (files, trayName) => {
        console.log(files);
        return new Promise(async (resolve, reject) => {
            setSubmitStatus('Uploading STL files');

            // upload files with firebase client
            const timestamp = dayjs().toISOString();
            let urls = [];
            for (const file of files) {
                const storageRef = ref(storage, `stl/${trayName}_${timestamp}/${file.name}`);
                const uploadTask = await uploadBytes(storageRef, file);
                console.log(uploadTask);
                // now get url
                const url = await getDownloadURL(uploadTask.ref);
                urls.push(url);
            }

            resolve(urls);
        });
    };

    const validate = useCallback(
        (values, activeStep) => {
            if (steps[activeStep].checkComplete) {
                if (steps[activeStep].checkComplete(values)) {
                    setCanContinue(true);
                } else {
                    setCanContinue(false);
                }
            }
            return {};
        },
        [steps]
    );

    return (
        <Formik
            validate={(values) => {
                return validate(values, activeStep);
            }}
            initialValues={{
                pi: {
                    label: '',
                    value: ''
                },
                stlFiles: [],
                printerType: {},
                printer: {},
                firstName: '',
                lastName: '',
                email: '',
                printName: '',
                material: {
                    label: '',
                    value: ''
                },
                materialUsage: '',
                estTimeHours: '',
                estTimeMinutes: ''
            }}
            onSubmit={(values, actions) => {
                uploadFiles(values.stlFiles, values.printName)
                    .then((urls) => {
                        setSubmitStatus('Adding print to queue');
                        const timestamp = dayjs.utc();

                        const payload = {
                            trayName: values.printName,
                            printer: values.printer.id,
                            estTime: dayjs.duration(`PT${values.estTimeHours}H${values.estTimeMinutes}M`).toISOString(),
                            materialType: values.material.value,
                            materialUsage: values.materialUsage,
                            queuedBy: values.pi.value,
                            queuedAt: timestamp,
                            notes: '',
                            state: PrintStates.QUEUED,
                            stlFiles: urls,
                            endUser: {
                                firstname: values.firstName,
                                lastname: values.lastName,
                                email: values.email
                            },
                            events: [
                                {
                                    type: PrintStates.QUEUED,
                                    timestamp: timestamp,
                                    notes: ''
                                }
                            ]
                        };

                        request('/api/printing/queue', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        })
                            .then((res) => {
                                actions.setSubmitting(false);
                                setActiveStep((s) => s + 1);
                            })
                            .catch((err) => {
                                toast({
                                    title: 'Error',
                                    description: `Couldn't queue the print: ${err.message}`,
                                    status: 'error',
                                    duration: 5000
                                });
                            });
                    })
                    .catch((err) => {
                        toast({
                            title: 'Error uploading preview',
                            description: err,
                            status: 'error',
                            duration: 5000
                        });
                    });
            }}
        >
            {(props) => (
                <Modal
                    isOpen={isOpen}
                    onClose={() => {
                        onClose();
                        setActiveStep(0);
                        props.handleReset();
                    }}
                    isCentered
                    size="lg"
                    scrollBehavior="inside"
                    closeOnOverlayClick={false}
                >
                    <ModalOverlay />
                    <ModalContent>
                        <Form>
                            <ModalHeader pb={0}>New print</ModalHeader>
                            <ModalCloseButton />

                            <ModalBody
                                display="flex"
                                flexDir="column"
                                gap={2}
                            >
                                <VStack
                                    spacing={0}
                                    w="full"
                                    h="auto"
                                    align="start"
                                >
                                    <Stepper
                                        size="sm"
                                        w="100%"
                                        minH="50px"
                                        index={activeStep}
                                        gap={0}
                                    >
                                        {steps.slice(0, steps.length - 1).map((step, index) => (
                                            <Step
                                                key={index}
                                                gap={0}
                                            >
                                                <StepIndicator>
                                                    <StepStatus
                                                        complete={<StepIcon />}
                                                        // incomplete={<StepNumber />}
                                                        // active={<StepNumber />}
                                                    />
                                                </StepIndicator>

                                                <StepSeparator _horizontal={{ ml: '0' }} />
                                            </Step>
                                        ))}
                                    </Stepper>
                                    <Text
                                        fontSize="2xl"
                                        fontWeight="semibold"
                                        alignSelf="start"
                                    >
                                        {steps[activeStep].title}
                                    </Text>
                                </VStack>

                                <Divider mb={2} />

                                <VStack w="full">
                                    {activeStep === 0 && (
                                        <Field name="stlFiles">
                                            {({ form, field }) => (
                                                <STLInput
                                                    setFiles={(files) => {
                                                        form.setFieldValue('stlFiles', files);
                                                    }}
                                                    files={field?.value}
                                                />
                                            )}
                                        </Field>
                                    )}

                                    {activeStep === 1 && (
                                        <>
                                            <Field name="pi">
                                                {({ form, field }) => (
                                                    <FormControl>
                                                        <Select
                                                            {...field}
                                                            w="full"
                                                            placeholder="PI name"
                                                            options={peerInstructors.map((pi) => ({
                                                                label: pi.name,
                                                                value: pi.name
                                                            }))}
                                                            onChange={(selectedOption) => {
                                                                return form.setFieldValue('pi', selectedOption);
                                                            }}
                                                            value={field?.value}
                                                        />
                                                    </FormControl>
                                                )}
                                            </Field>
                                        </>
                                    )}

                                    {activeStep === 2 && (
                                        <>
                                            <Field name="printerType">
                                                {({ form, field }) => (
                                                    <>
                                                        {printerTypes.map((type) => {
                                                            return (
                                                                <>
                                                                    <Card
                                                                        key={type.id}
                                                                        variant="outline"
                                                                        bg="transparent"
                                                                        w="full"
                                                                        as={Button}
                                                                        h="auto"
                                                                        p={0}
                                                                        onClick={() => {
                                                                            props.setFieldValue('printerType', type);
                                                                        }}
                                                                        isActive={field.value?.id === type.id}
                                                                    >
                                                                        <CardBody
                                                                            p={4}
                                                                            w="full"
                                                                        >
                                                                            <VStack spacing={5}>
                                                                                <HStack w="full">
                                                                                    <VStack
                                                                                        w="full"
                                                                                        align="start"
                                                                                        spacing={1}
                                                                                    >
                                                                                        <Heading size="md">
                                                                                            {type.displayName}
                                                                                        </Heading>
                                                                                        <Text fontWeight="normal">
                                                                                            {type.description}
                                                                                        </Text>
                                                                                    </VStack>
                                                                                </HStack>
                                                                            </VStack>
                                                                        </CardBody>
                                                                    </Card>
                                                                </>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </Field>
                                        </>
                                    )}

                                    {activeStep === 3 && (
                                        <>
                                            <Field name="printer">
                                                {({ form, field }) => {
                                                    return (
                                                        <>
                                                            {printers
                                                                .filter((p) => p.type === form.values.printerType?.id)
                                                                .map((printer) => {
                                                                    return (
                                                                        <PrinterItem
                                                                            key={printer.id}
                                                                            printer={printer}
                                                                            onClick={() => {
                                                                                props.setFieldValue('printer', printer);
                                                                            }}
                                                                            isActive={field.value?.id === printer.id}
                                                                        />
                                                                    );
                                                                })}
                                                            <Text
                                                                fontSize="xs"
                                                                color="secondaryText"
                                                                alignSelf="start"
                                                            >
                                                                Wait times do not account for The HIVE&apos;s closed
                                                                hours. Prints are not guaranteed to be started during
                                                                closed hours.
                                                            </Text>
                                                        </>
                                                    );
                                                }}
                                            </Field>
                                        </>
                                    )}

                                    {activeStep === 4 && (
                                        <>
                                            <HStack>
                                                <Field name="firstName">
                                                    {({ form, field }) => (
                                                        <FormControl>
                                                            <FormLabel>First name</FormLabel>
                                                            <Input {...field} />
                                                        </FormControl>
                                                    )}
                                                </Field>

                                                <Field name="lastName">
                                                    {({ form, field }) => (
                                                        <FormControl>
                                                            <FormLabel>Last name</FormLabel>
                                                            <Input {...field} />
                                                        </FormControl>
                                                    )}
                                                </Field>
                                            </HStack>

                                            <Field name="email">
                                                {({ form, field }) => (
                                                    <FormControl>
                                                        <FormLabel>@gatech.edu email</FormLabel>
                                                        <InputGroup>
                                                            <Input {...field} />
                                                            <InputRightAddon>@gatech.edu</InputRightAddon>
                                                        </InputGroup>
                                                    </FormControl>
                                                )}
                                            </Field>
                                        </>
                                    )}

                                    {activeStep === 5 && (
                                        <>
                                            <Field name="printName">
                                                {({ form, field }) => (
                                                    <FormControl>
                                                        <FormLabel>Print name</FormLabel>
                                                        <Input {...field} />
                                                    </FormControl>
                                                )}
                                            </Field>

                                            <HStack w="full">
                                                <Field name="material">
                                                    {({ form, field }) => (
                                                        <FormControl>
                                                            <FormLabel>Material</FormLabel>
                                                            <Select
                                                                options={form.values.printerType?.materials.map(
                                                                    (material) => {
                                                                        return {
                                                                            label: material,
                                                                            value: material
                                                                        };
                                                                    }
                                                                )}
                                                                onChange={(selectedOption) => {
                                                                    return form.setFieldValue(
                                                                        'material',
                                                                        selectedOption
                                                                    );
                                                                }}
                                                                value={field?.value}
                                                            />
                                                        </FormControl>
                                                    )}
                                                </Field>

                                                <Field name="materialUsage">
                                                    {({ form, field }) => (
                                                        <FormControl>
                                                            <FormLabel>Material usage</FormLabel>
                                                            <InputGroup>
                                                                <Input
                                                                    {...field}
                                                                    type="number"
                                                                />
                                                                <InputRightAddon>
                                                                    {form.values.printerType.materialUnits.symbol}
                                                                </InputRightAddon>
                                                            </InputGroup>
                                                        </FormControl>
                                                    )}
                                                </Field>
                                            </HStack>

                                            <FormControl>
                                                <FormLabel>Estimated print time</FormLabel>
                                                <VStack>
                                                    <HStack>
                                                        <Field name="estTimeHours">
                                                            {({ form, field }) => (
                                                                <Input
                                                                    {...field}
                                                                    type="number"
                                                                    placeholder="hours"
                                                                />
                                                            )}
                                                        </Field>
                                                        <Text
                                                            fontSize="xl"
                                                            fontWeight="medium"
                                                        >
                                                            {':'}
                                                        </Text>
                                                        <Field name="estTimeMinutes">
                                                            {({ form, field }) => (
                                                                <Input
                                                                    {...field}
                                                                    type="number"
                                                                    placeholder="minutes"
                                                                />
                                                            )}
                                                        </Field>
                                                        <Icon
                                                            fontSize="2xl"
                                                            as={iconSet.rightArrow}
                                                        />
                                                        <Text
                                                            fontSize="2xl"
                                                            fontWeight="medium"
                                                        >
                                                            {dayjs
                                                                .duration(
                                                                    `PT${props.values.estTimeHours}H${props.values.estTimeMinutes}M`
                                                                )
                                                                .format('HH:mm')}
                                                        </Text>
                                                    </HStack>
                                                    {/* {props.values.estTimeHours >= 8 &&
                                                    props.values.estTimeMinutes >= 0 ? (
                                                        <Alert
                                                            status="error"
                                                            borderRadius="md"
                                                        >
                                                            <HStack>
                                                                <Checkbox colorScheme="red" />
                                                                <AlertDescription>
                                                                    Verify the end user has permission for this print
                                                                </AlertDescription>
                                                            </HStack>
                                                        </Alert>
                                                    ) : null} */}
                                                </VStack>
                                            </FormControl>
                                        </>
                                    )}

                                    {activeStep >= 6 && (
                                        <>
                                            {props.isSubmitting ? (
                                                <>
                                                    <VStack
                                                        w="full"
                                                        h="200px"
                                                        justify="center"
                                                    >
                                                        <HStack
                                                            w="full"
                                                            justify="center"
                                                            spacing={3}
                                                        >
                                                            <Spinner colorScheme="blue" />
                                                            <Text
                                                                fontSize="lg"
                                                                fontWeight="medium"
                                                            >
                                                                {submitStatus}
                                                            </Text>
                                                        </HStack>
                                                    </VStack>
                                                </>
                                            ) : (
                                                <>
                                                    <Alert
                                                        status="success"
                                                        variant="subtle"
                                                        flexDirection="column"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                        textAlign="center"
                                                        height="200px"
                                                    >
                                                        <AlertIcon
                                                            boxSize="40px"
                                                            mr={0}
                                                        />
                                                        <AlertTitle
                                                            mt={4}
                                                            mb={1}
                                                            fontSize="lg"
                                                        >
                                                            Print submitted
                                                        </AlertTitle>
                                                        <AlertDescription maxWidth="sm">
                                                            Make sure the tray has the same name when sending it to a
                                                            printer!
                                                        </AlertDescription>
                                                    </Alert>
                                                </>
                                            )}
                                        </>
                                    )}
                                </VStack>
                            </ModalBody>
                            <ModalFooter spacing={3}>
                                {activeStep < 6 ? (
                                    <ButtonGroup w="full">
                                        <Button
                                            colorScheme="blue"
                                            leftIcon={<Icon as={iconSet.leftArrow} />}
                                            onClick={() => {
                                                validate(props.values, activeStep - 1);
                                                setActiveStep((s) => s - 1);
                                            }}
                                            isDisabled={activeStep <= 0}
                                        >
                                            Previous
                                        </Button>
                                        <Spacer />
                                        <Button
                                            colorScheme="blue"
                                            rightIcon={<Icon as={iconSet.rightArrow} />}
                                            onClick={() => {
                                                if (activeStep === steps.length - 3) {
                                                    props.handleSubmit();
                                                }
                                                validate(props.values, activeStep + 1);
                                                setActiveStep((s) => s + 1);
                                            }}
                                            isDisabled={activeStep >= steps.length || !canContinue}
                                        >
                                            Next
                                        </Button>
                                    </ButtonGroup>
                                ) : (
                                    <>
                                        <Spacer />
                                        <Button
                                            colorScheme="blue"
                                            leftIcon={<Icon as={iconSet.check} />}
                                            onClick={() => {
                                                props.handleReset();
                                                onClose();
                                                setActiveStep(0);
                                            }}
                                            isDisabled={props.isSubmitting}
                                        >
                                            Done
                                        </Button>
                                    </>
                                )}
                            </ModalFooter>
                        </Form>
                    </ModalContent>
                </Modal>
            )}
        </Formik>
    );
}
