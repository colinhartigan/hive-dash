import { useCallback, useEffect, useState } from 'react';

import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    ButtonGroup,
    Center,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Heading,
    Icon,
    Input,
    InputGroup,
    Switch,
    Text,
    Textarea,
    VStack
} from '@chakra-ui/react';

import { Select } from 'chakra-react-select';
import ChakraUIRenderer from 'chakra-ui-markdown-renderer';
import ReactMarkdown from 'react-markdown';

import iconSet from '@/util/icons';

import ConfigLayout from '@/layouts/config/ConfigLayout';

export default function WebsiteSettings(props) {
    const [config, setConfig] = useState({});
    const [saving, setSaving] = useState(false);

    const refresh = useCallback(() => {
        fetch('/api/config/website')
            .then((res) => res.json())
            .then((data) => {
                console.log(data.config);
                setConfig(data.config);
            });
    }, []);

    const save = useCallback(() => {
        setSaving(true);
        fetch('/api/config/website', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        })
            .then((res) => res.json())
            .then((data) => {
                refresh();
            })
            .finally(() => {
                setSaving(false);
            });
    }, [config, refresh]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const update = useCallback((field, value) => {
        setConfig((old) => {
            return {
                ...old,
                [field]: {
                    ...old[field],
                    ...value
                }
            };
        });
    }, []);

    return (
        <Flex
            w="full"
            h="full"
            p={5}
            overflow="hidden"
            direction="column"
            align="center"
        >
            <Center
                w="full"
                h="auto"
                overflow="auto"
            >
                <VStack
                    w="xl"
                    h="full"
                    spacing={3}
                    align="flex-start"
                    justify="start"
                >
                    <Heading
                        size="lg"
                        fontFamily="body"
                    >
                        Banner configuration
                    </Heading>

                    <FormControl>
                        <FormLabel>Banner enabled</FormLabel>
                        <InputGroup>
                            <Switch
                                isChecked={config?.banner?.enabled}
                                onChange={(e) => {
                                    update('banner', { enabled: e.target.checked });
                                }}
                            />
                        </InputGroup>
                        <FormHelperText>Show the banner on all pages on the website.</FormHelperText>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Banner type</FormLabel>
                        <Select
                            value={{
                                value: config?.banner?.type,
                                label: config?.banner?.type
                            }}
                            options={[
                                { value: 'info', label: 'Info' },
                                { value: 'warning', label: 'Warning' },
                                { value: 'success', label: 'Success' },
                                { value: 'error', label: 'Error' }
                            ]}
                            onChange={(e) => {
                                update('banner', { type: e.value });
                            }}
                        />
                        <FormHelperText>Controls the color/icon on the banner</FormHelperText>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Banner title</FormLabel>
                        <InputGroup>
                            <Input
                                value={config?.banner?.title}
                                onChange={(e) => {
                                    update('banner', { title: e.target.value });
                                }}
                            />
                        </InputGroup>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Banner description</FormLabel>
                        <InputGroup>
                            <Textarea
                                value={config?.banner?.subtitle}
                                onChange={(e) => {
                                    update('banner', { subtitle: e.target.value });
                                }}
                            />
                        </InputGroup>
                        <FormHelperText>Markdown is supported.</FormHelperText>
                    </FormControl>

                    <VStack
                        w="100%"
                        h="auto"
                        align="start"
                    >
                        <Text>Banner preview</Text>
                        <Alert
                            status={config?.banner?.type}
                            w="100%"
                            h="auto"
                        >
                            <AlertIcon />
                            <Box>
                                <AlertTitle>{config?.banner?.title}</AlertTitle>
                                <AlertDescription>
                                    <ReactMarkdown
                                        components={ChakraUIRenderer()}
                                        skipHtml
                                    >
                                        {config?.banner?.subtitle}
                                    </ReactMarkdown>
                                </AlertDescription>
                            </Box>
                        </Alert>
                    </VStack>
                </VStack>
            </Center>

            <HStack
                w="full"
                h="auto"
                justify="cetner"
            >
                <ButtonGroup w="auto">
                    <Button
                        colorScheme="blue"
                        isLoading={saving}
                        leftIcon={<Icon as={iconSet.save} />}
                        onClick={save}
                    >
                        Save
                    </Button>
                </ButtonGroup>
            </HStack>
        </Flex>
    );
}

WebsiteSettings.getLayout = (page) => <ConfigLayout>{page}</ConfigLayout>;
