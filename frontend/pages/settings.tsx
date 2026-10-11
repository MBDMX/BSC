import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import {
    Box, Heading, Card, CardBody, VStack, HStack, FormControl, FormLabel, Input, Switch,
    Select, Button, Text, useToast, Divider, Table, Thead, Tbody, Tr, Th, Td, Badge, Spinner,
    Icon, SimpleGrid
} from '@chakra-ui/react';
import { MdPhone, MdNotifications, MdHistory, MdSend, MdEmail, MdWarning, MdDeleteForever } from 'react-icons/md';
import { useRouter } from 'next/router';

interface Settings {
    phone_number: string | null;
    notifications_enabled: number;
    email: string | null;
    email_notifications_enabled: number;
    notification_frequency: string;
}

export default function Settings() {
    const [settings, setSettings] = useState<Settings>({
        phone_number: null,
        notifications_enabled: 1,
        email: null,
        email_notifications_enabled: 1,
        notification_frequency: 'immediate'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingSMS, setTestingSMS] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const toast = useToast();
    const router = useRouter();

    const fetchSettings = async () => {
        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            const url = isLocalhost ? 'http://localhost:8000/settings' : '/api/settings';
            const headers: Record<string, string> = {};
            if (isLocalhost) headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;

            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data && Object.keys(data).length > 0) {
                    setSettings(prev => ({ ...prev, ...data }));
                    return;
                }
            }
            const saved = localStorage.getItem('app_settings');
            if (saved) {
                setSettings(JSON.parse(saved));
            }
        } catch (error) {
            console.warn('Error fetching settings, using local:', error);
            const saved = localStorage.getItem('app_settings');
            if (saved) {
                setSettings(JSON.parse(saved));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            localStorage.setItem('app_settings', JSON.stringify(settings));
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            const url = isLocalhost ? 'http://localhost:8000/settings' : '/api/settings';
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (isLocalhost) headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;

            await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(settings)
            }).catch(() => null);
            toast({
                title: '✅ Paramètres sauvegardés',
                status: 'success',
                duration: 3000
            });
        } catch (error) {
            toast({
                title: '❌ Erreur de sauvegarde',
                status: 'error',
                duration: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTestSMS = async () => {
        setTestingSMS(true);
        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            const url = isLocalhost
                ? 'http://localhost:8000/notifications/test'
                : '/api/notifications/test';
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (isLocalhost) headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ phone_number: settings.phone_number })
            });
            const data = await res.json();
            if (res.ok && data.details?.status === 'sent') {
                toast({
                    title: '📱 SMS de test envoyé',
                    description: 'Vérifiez votre téléphone !',
                    status: 'success',
                    duration: 5000
                });
            } else {
                toast({
                    title: '📱 SMS envoyé (Sandbox)',
                    description: `Numéro : ${settings.phone_number || 'Non renseigné'}`,
                    status: 'info',
                    duration: 4000
                });
            }
        } catch (error) {
            toast({
                title: '📱 Erreur SMS',
                description: 'Impossible d\'envoyer le SMS',
                status: 'error',
                duration: 4000
            });
        } finally {
            setTestingSMS(false);
        }
    };

    const handleTestEmail = async () => {
        setTestingEmail(true);
        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            const url = isLocalhost
                ? 'http://localhost:8000/notifications/test-email'
                : '/api/notifications/test-email';
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (isLocalhost) headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ email: settings.email })
            });
            const data = await res.json();
            if (res.ok && data.details?.status === 'sent') {
                toast({
                    title: '📧 Email de test envoyé !',
                    description: `Email envoyé à : ${settings.email || 'Adresse par défaut'}`,
                    status: 'success',
                    duration: 5000
                });
            } else {
                toast({
                    title: '📧 Email envoyé (Sandbox)',
                    description: data.details?.note || `Email configuré : ${settings.email || 'Non renseigné'}`,
                    status: 'info',
                    duration: 4000
                });
            }
        } catch (error) {
            toast({
                title: '📧 Erreur Email',
                description: 'Impossible d\'envoyer l\'email',
                status: 'error',
                duration: 4000
            });
        } finally {
            setTestingEmail(false);
        }
    };

    const handleGlobalReset = async () => {
        if (!window.confirm("⚠️ ATTENTION: Cette action est irréversible !\n\nCela va effacer TOUTES les ventes, dépenses et historique de stock.\n\nÊtes-vous sûr de vouloir continuer ?")) {
            return;
        }

        if (!window.confirm("🛑 DERNIÈRE VÉRIFICATION\n\nConfirmez-vous la réinitialisation TOTALE du système ?\n\nToutes les données seront perdues.")) {
            return;
        }

        setIsResetting(true);
        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            if (isLocalhost) {
                const token = localStorage.getItem('access_token');
                await fetch('http://localhost:8000/global-reset', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => null);
            }
            localStorage.removeItem('menuProduits');
            localStorage.removeItem('matieresPremieres');
            localStorage.removeItem('bsc_cloud_sales');
            localStorage.removeItem('bsc_cloud_expenses');
            localStorage.removeItem('bsc_cloud_invoices');
            toast({
                title: '♻️ Système Réinitialisé',
                description: 'Le système et les caches locaux ont été réinitialisés.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erreur',
                description: 'La réinitialisation a échoué.',
                status: 'error',
                duration: 3000
            });
        } finally {
            setIsResetting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        toast({
            title: "Déconnexion réussie",
            status: "info",
            duration: 3000,
            isClosable: true,
        });
        router.push('/login');
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <Layout>
                    <Box p={8} textAlign="center">
                        <Spinner size="xl" color="blue.500" />
                    </Box>
                </Layout>
            </ProtectedRoute>
        );
    }

    return (
        <Box bg="gray.50" minH="100vh" p={{ base: 4, md: 8 }}>
            <Box maxW="5xl" mx="auto">
                <HStack justify="space-between" mb={6}>
                    <Heading bgGradient="linear(to-r, blue.600, purple.600)" bgClip="text" size="lg">
                        ⚙️ Paramètres Généraux
                    </Heading>
                </HStack>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
                    {/* SMS Settings Card */}
                    <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
                        <CardBody>
                            <VStack align="stretch" spacing={5}>
                                <HStack>
                                    <Icon as={MdPhone} boxSize={6} color="blue.500" />
                                    <Heading size="md">Alertes SMS</Heading>
                                </HStack>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">📞 Numéro de Téléphone</FormLabel>
                                    <Input
                                        type="tel"
                                        placeholder="+216 XX XXX XXX"
                                        value={settings.phone_number || ''}
                                        onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                                        size="md"
                                        borderRadius="lg"
                                    />
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        Format international (ex: +216XXXXXXXX)
                                    </Text>
                                </FormControl>

                                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                    <FormLabel mb={0} fontSize="sm">Activer les SMS</FormLabel>
                                    <Switch
                                        isChecked={settings.notifications_enabled === 1}
                                        onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked ? 1 : 0 })}
                                        colorScheme="blue"
                                    />
                                </FormControl>

                                <Button
                                    colorScheme="blue"
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<MdSend />}
                                    onClick={handleTestSMS}
                                    isLoading={testingSMS}
                                    isDisabled={!settings.phone_number}
                                >
                                    Tester le SMS
                                </Button>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Email Settings Card */}
                    <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
                        <CardBody>
                            <VStack align="stretch" spacing={5}>
                                <HStack>
                                    <Icon as={MdEmail} boxSize={6} color="purple.500" />
                                    <Heading size="md">Alertes Email</Heading>
                                </HStack>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">📧 Adresse Email</FormLabel>
                                    <Input
                                        type="email"
                                        placeholder="votre@email.com"
                                        value={settings.email || ''}
                                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                        size="md"
                                        borderRadius="lg"
                                    />
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        Utilisé pour les alertes de stock critiques
                                    </Text>
                                </FormControl>

                                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                    <FormLabel mb={0} fontSize="sm">Activer les Emails</FormLabel>
                                    <Switch
                                        isChecked={settings.email_notifications_enabled === 1}
                                        onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked ? 1 : 0 })}
                                        colorScheme="purple"
                                    />
                                </FormControl>

                                <Button
                                    colorScheme="purple"
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<MdSend />}
                                    onClick={handleTestEmail}
                                    isLoading={testingEmail}
                                    isDisabled={!settings.email}
                                >
                                    Tester l'Email
                                </Button>
                            </VStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Frequency Selection */}
                <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor="gray.100" mb={6}>
                    <CardBody>
                        <VStack align="stretch" spacing={4}>
                            <HStack>
                                <Icon as={MdNotifications} boxSize={6} color="orange.400" />
                                <Heading size="md">Fréquence et Sauvegarde</Heading>
                            </HStack>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">⏰ Délai entre les alertes</FormLabel>
                                    <Select
                                        value={settings.notification_frequency}
                                        onChange={(e) => setSettings({ ...settings, notification_frequency: e.target.value })}
                                        borderRadius="lg"
                                    >
                                        <option value="immediate">Immédiate (Min. 6h entre alertes)</option>
                                        <option value="daily">Quotidienne (1 fois / 24h)</option>
                                        <option value="weekly">Hebdomadaire (1 fois / 7j)</option>
                                    </Select>
                                </FormControl>

                                <Box display="flex" alignItems="flex-end">
                                    <Button
                                        colorScheme="green"
                                        size="md"
                                        onClick={handleSave}
                                        isLoading={saving}
                                        w="full"
                                        borderRadius="lg"
                                        h="40px"
                                    >
                                        💾 Enregistrer les préférences
                                    </Button>
                                </Box>
                            </SimpleGrid>
                        </VStack>
                    </CardBody>
                </Card>

                {/* Danger Zone */}
                <Card bg="red.50" borderRadius="2xl" boxShadow="sm" border="1px dashed" borderColor="red.300">
                    <CardBody>
                        <VStack align="stretch" spacing={4}>
                            <HStack>
                                <Icon as={MdWarning} boxSize={6} color="red.500" />
                                <Heading size="md" color="red.700">Zone de Danger</Heading>
                            </HStack>

                            <Text fontSize="sm" color="red.600">
                                Les actions ci-dessous sont irréversibles. Soyez prudent.
                            </Text>

                            <Button
                                colorScheme="red"
                                size="lg"
                                leftIcon={<MdDeleteForever />}
                                onClick={handleGlobalReset}
                                isLoading={isResetting}
                                w="full"
                                borderRadius="xl"
                                _hover={{ bg: 'red.600' }}
                            >
                                RÉINITIALISER TOUT LE SYSTÈME
                            </Button>
                            <Text fontSize="xs" color="red.500" textAlign="center">
                                Efface toutes les ventes, dépenses, et remet les stocks à zéro.
                            </Text>
                        </VStack>
                    </CardBody>
                </Card>
            </Box>
        </Box>
    );
}
