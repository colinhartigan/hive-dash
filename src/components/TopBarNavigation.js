import {
    Divider,
    Flex,
    HStack,
    Heading,
    Icon,
    IconButton,
    Menu,
    MenuButton,
    MenuDivider,
    MenuGroup,
    MenuItem,
    MenuList,
    Spacer,
    useColorMode
} from '@chakra-ui/react';

import NextImage from 'next/image';
import NextLink from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import useNav from '@/contexts/NavContext';

import iconSet from '@/util/icons';
import { PITypes } from '@/util/roles';

import logoDark from '@/assets/logo_dark.png';
import logoLight from '@/assets/logo_light.png';

import AuthMenu from './auth/AuthMenu';

export default function TopBarNavigation({ pages }) {
    const { colorMode, toggleColorMode } = useColorMode();

    const { section } = useNav();

    const { roleId } = useAuth();

    return (
        <Flex
            direction="row"
            w="100%"
            h="full"
            borderBottom="1px solid"
            borderColor="chakra-border-color"
        >
            <HStack
                w="auto"
                h="100%"
                dir="row"
                flexGrow={1}
                alignItems="center"
                justifyContent="flex-end"
                spacing={3}
                p={3}
                display={{ base: 'flex', md: 'none' }}
            >
                <IconButton>
                    <Icon as={iconSet.rightArrow} />
                </IconButton>
            </HStack>

            <HStack
                w="auto"
                h="100%"
                direction="row"
                alignItems="center"
                justifyContent={{ base: 'center', md: 'center' }}
                spacing={4}
                py={3}
                px={5}
                // borderRight="1px solid"
                borderColor="chakra-border-color"
            >
                <NextImage
                    alt="HIVE logo"
                    src={colorMode === 'dark' ? logoDark : logoLight}
                    height={34}
                    placeholder="blur"
                    priority
                />

                <Divider orientation="vertical" />

                <Menu>
                    <MenuButton>
                        <HStack>
                            <Heading
                                size="md"
                                fontFamily="Rubik"
                                fontWeight="medium"
                            >
                                {pages[section]}
                            </Heading>
                            {/* <Icon as={iconSet.hamburger} /> */}
                        </HStack>
                    </MenuButton>
                    <MenuList>
                        <MenuItem
                            as={NextLink}
                            href="/printing/dashboard"
                            size="md"
                            isActive={section === 'printing'}
                            icon={<Icon as={iconSet.printer} />}
                        >
                            3D Printing
                        </MenuItem>
                    </MenuList>
                </Menu>
            </HStack>

            <HStack
                w="auto"
                h="100%"
                flexGrow={1}
                direction="row"
                alignItems="center"
                justifyContent="flex-start"
                spacing={3}
                px={5}
                py={3}
                display={{ base: 'none', md: 'flex' }}
            >
                <Spacer />
                <IconButton onClick={toggleColorMode}>
                    {colorMode === 'dark' ? <Icon as={iconSet.sun} /> : <Icon as={iconSet.moon} />}
                </IconButton>

                {roleId >= PITypes.MPI && (
                    <IconButton
                        as={NextLink}
                        href="/config"
                        isActive={section === 'config'}
                    >
                        <Icon as={iconSet.settings} />
                    </IconButton>
                )}

                <AuthMenu />
            </HStack>

            {/* mobile */}
            <HStack
                w="auto"
                h="100%"
                dir="row"
                flexGrow={1}
                alignItems="center"
                justifyContent="flex-end"
                spacing={3}
                p={3}
                display={{ base: 'flex', md: 'none' }}
            >
                <Menu>
                    <MenuButton
                        as={IconButton}
                        aria-label="Options"
                        icon={<Icon as={iconSet.hamburger} />}
                        variant="solid"
                    />
                    <MenuList>
                        <MenuGroup>
                            <MenuItem>3D Printing</MenuItem>
                            <MenuItem>Settings</MenuItem>
                        </MenuGroup>
                        <MenuDivider />
                        <MenuGroup>
                            <HStack
                                px={3}
                                justify="start"
                            >
                                <IconButton
                                    size="sm"
                                    onClick={toggleColorMode}
                                    icon={colorMode === 'dark' ? <Icon as={iconSet.sun} /> : <Icon as={iconSet.moon} />}
                                />
                            </HStack>
                        </MenuGroup>
                    </MenuList>
                </Menu>
            </HStack>
        </Flex>
    );
}
