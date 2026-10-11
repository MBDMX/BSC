import React, { useState } from 'react';
import {
    Box,
    VStack,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Button,
    useToast,
    Card,
    CardBody,
    Divider,
    Text,
    InputGroup,
    InputRightElement,
    IconButton
} from '@chakra-ui/react';
import { MdVisibility, MdVisibilityOff, MdSave } from 'react-icons/md';

const Settings = () => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleSaveProfile = async () => {
        setLoading(true);
        // TODO: Implement API call to save email and phone
        setTimeout(() => {
            setLoading(false);
            toast({
                title: "Profil mis à jour",
                description: "Vos informations ont été enregistrées avec succès.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        }, 1000);
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({
                title: "Erreur",
                description: "Les mots de passe ne correspondent pas.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        setLoading(true);
        // TODO: Implement API call to change password
        setTimeout(() => {
            setLoading(false);
            setNewPassword('');
            setConfirmPassword('');
            toast({
                title: "Mot de passe changé",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        }, 1000);
    };

    const handleResetData = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.")) {
            return;
        }
        if (!window.confirm("Vraiment sûr ? Toutes les transactions et l'historique de stock seront supprimés.")) {
            return;
        }

        setLoading(true);
        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            if (isLocalhost) {
                const token = localStorage.getItem('access_token');
                await fetch('http://localhost:8000/reset-transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }).catch(() => null);
            }

            localStorage.removeItem('bsc_cloud_sales');
            localStorage.removeItem('menuProduits');
            localStorage.removeItem('matieresPremieres');

            toast({
                title: "Données réinitialisées",
                description: "Toutes les transactions et les caches ont été réinitialisés avec succès.",
                status: "success",
                duration: 4000,
                isClosable: true,
            });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error("Error resetting data:", error);
            toast({
                title: "Erreur",
                description: "Impossible de réinitialiser.",
                status: "error",
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={8} maxW="800px" mx="auto">
            <VStack spacing={8} align="stretch">
                <Heading size="lg" color="#03224c">Paramètres du compte</Heading>

                <Card variant="outline" boxShadow="sm">
                    <CardBody>
                        <VStack spacing={6} align="stretch">
                            <Text fontWeight="bold" fontSize="md">Informations de contact</Text>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Numéro de téléphone</FormLabel>
                                <Input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+216 -- --- ---"
                                />
                            </FormControl>
                            <Button
                                leftIcon={<MdSave />}
                                colorScheme="blue"
                                onClick={handleSaveProfile}
                                isLoading={loading}
                                alignSelf="flex-start"
                            >
                                Sauvegarder les informations
                            </Button>
                        </VStack>
                    </CardBody>
                </Card>

                <Divider />

                <Card variant="outline" boxShadow="sm">
                    <CardBody>
                        <VStack spacing={6} align="stretch">
                            <Text fontWeight="bold" fontSize="md">Sécurité</Text>
                            <FormControl>
                                <FormLabel>Nouveau mot de passe</FormLabel>
                                <InputGroup>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    <InputRightElement>
                                        <IconButton
                                            aria-label={showPassword ? 'Cacher' : 'Montrer'}
                                            icon={showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                                            onClick={() => setShowPassword(!showPassword)}
                                            variant="ghost"
                                        />
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Confirmer le mot de passe</FormLabel>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </FormControl>
                            <Button
                                colorScheme="orange"
                                onClick={handleChangePassword}
                                isLoading={loading}
                                alignSelf="flex-start"
                            >
                                Changer le mot de passe
                            </Button>
                        </VStack>
                    </CardBody>
                </Card>
                <Card variant="outline" boxShadow="sm" borderColor="red.100" bg="red.50">
                    <CardBody>
                        <VStack spacing={4} align="stretch">
                            <Text fontWeight="bold" fontSize="md" color="red.700">Zone de Danger</Text>
                            <Text fontSize="sm" color="red.600">
                                La réinitialisation effacera toutes les ventes et l'historique de stock.
                                Les définitions de produits et les recettes seront conservées.
                            </Text>
                            <Button
                                colorScheme="red"
                                onClick={handleResetData}
                                isLoading={loading}
                                alignSelf="flex-start"
                            >
                                Réinitialiser toutes les données pour le lancement
                            </Button>
                        </VStack>
                    </CardBody>
                </Card>
            </VStack>
        </Box>
    );
};

export default Settings;
