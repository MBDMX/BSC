import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { formatQuantity, formatCurrency, parseRounded } from '../utils/formatters';
import {
    Box,
    Flex,
    VStack,
    HStack,
    Heading,
    Text,
    Select,
    Button,
    Input,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Card,
    CardBody,
    SimpleGrid,
    Badge,
    IconButton,
    FormControl,
    FormLabel,
    Spinner,
    Stack,
    Divider,
    useBreakpointValue,
    Icon
} from '@chakra-ui/react';
import { MdAdd, MdDelete, MdRefresh, MdAttachMoney, MdShowChart, MdPieChart } from 'react-icons/md';

interface Expense {
    id: number;
    nom: string;
    type: string;
    montant: number;
    date: string;
    recurrence: string;
    quantite?: number;
    unite?: string;
}

interface Product {
    id: number;
    nom: string;
    categorie: string;
    cout_unitaire: number;
    unite: string;
}

import { supabase } from '../lib/supabaseClient';

export default function ChargesManagement() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [loading, setLoading] = useState(false);
    const isMobile = useBreakpointValue({ base: true, md: false });

    const [newExpense, setNewExpense] = useState({
        nom: '',
        type: 'FIXE',
        montant: '',
        date: new Date().toISOString().slice(0, 10),
        recurrence: 'AUCUNE',
        // For ingredient purchases
        product_id: '',
        quantity: '',
        prix_achat: ''
    });

    useEffect(() => {
        fetchData();
        fetchProducts();
    }, [month, year]);

    const fetchProducts = async () => {
        try {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
            if (isLocalhost) {
                try {
                    const response = await fetch('http://localhost:8000/dashboard-data?include_hidden=true', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setProducts(data.products.filter((p: Product) => p.categorie === 'Ingredient'));
                        return;
                    }
                } catch (e) {
                    console.warn('Local products unreachable, using Supabase:', e);
                }
            }

            // Supabase fallback:
            const { data: prods } = await supabase.from('products').select('*');
            if (prods && prods.length > 0) {
                setProducts(
                    prods
                        .filter((p: any) => p.categorie === 'Ingredient' || p.type === 'INGREDIENT')
                        .map((p: any) => ({
                            id: p.id,
                            nom: p.nom,
                            categorie: p.categorie || 'Ingredient',
                            cout_unitaire: p.cout_unitaire || 0,
                            unite: p.unite || 'kg'
                        }))
                );
            }
        } catch (error) {
            console.warn('Erreur produits:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
        if (isLocalhost) {
            try {
                const token = localStorage.getItem('access_token');
                // Fetch Expenses
                const resExp = await fetch(`http://localhost:8000/expenses/${year}/${month}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resExp.ok) {
                    setExpenses(await resExp.json());
                }

                // Fetch Revenue for comparison
                const resSales = await fetch(`http://localhost:8000/sales-monthly?year=${year}&month=${month}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resSales.ok) {
                    const data = await resSales.json();
                    setMonthlyRevenue(data?.summary?.revenue || 0);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.warn('Local charges fetch notice:', err);
            }
        }

        // Cloud localStorage fallback:
        try {
            const saved = localStorage.getItem('bsc_cloud_expenses');
            if (saved) {
                setExpenses(JSON.parse(saved));
            } else {
                const defaultExpenses: Expense[] = [
                    { id: 1, nom: 'Loyer Local', type: 'FIXE', montant: 1200, date: `${year}-${String(month).padStart(2, '0')}-01`, recurrence: 'MENSUEL' },
                    { id: 2, nom: 'Facture STEG (Électricité)', type: 'VARIABLE', montant: 340, date: `${year}-${String(month).padStart(2, '0')}-10`, recurrence: 'MENSUEL' },
                    { id: 3, nom: 'Achat Pain Burger x100', type: 'INGREDIENT_PURCHASE', montant: 150, date: `${year}-${String(month).padStart(2, '0')}-12`, recurrence: 'AUCUNE', quantite: 100, unite: 'pièce' }
                ];
                setExpenses(defaultExpenses);
                localStorage.setItem('bsc_cloud_expenses', JSON.stringify(defaultExpenses));
            }
            setMonthlyRevenue(3200);
        } catch (e) {
            console.warn(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async () => {
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
        const token = localStorage.getItem('access_token');

        // Handle ingredient purchase separately
        if (newExpense.type === 'INGREDIENT_PURCHASE') {
            if (!newExpense.product_id || !newExpense.quantity || !newExpense.prix_achat) {
                toast.warning('Veuillez remplir tous les champs pour l\'achat d\'ingrédient');
                return;
            }

            if (isLocalhost) {
                try {
                    const res = await fetch('http://localhost:8000/ingredient-purchases', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            product_id: parseInt(newExpense.product_id),
                            quantity: parseRounded(newExpense.quantity),
                            prix_achat: parseRounded(newExpense.prix_achat),
                            date: newExpense.date
                        })
                    });

                    if (res.ok) {
                        toast.success('Achat d\'ingrédient enregistré !');
                        resetForm();
                        fetchData();
                        fetchProducts();
                        return;
                    }
                } catch (err) {
                    console.warn(err);
                }
            }

            // Cloud persistence:
            const prod = products.find(p => p.id === parseInt(newExpense.product_id));
            const expItem: Expense = {
                id: Date.now(),
                nom: `Achat: ${prod?.nom || 'Ingrédient'} x${newExpense.quantity}`,
                type: 'INGREDIENT_PURCHASE',
                montant: parseRounded(newExpense.quantity) * parseRounded(newExpense.prix_achat),
                date: newExpense.date,
                recurrence: 'AUCUNE',
                quantite: parseRounded(newExpense.quantity),
                unite: prod?.unite || 'kg'
            };
            const updated = [expItem, ...expenses];
            setExpenses(updated);
            localStorage.setItem('bsc_cloud_expenses', JSON.stringify(updated));

            // Sync stock increment to Supabase in cloud
            const prodId = parseInt(newExpense.product_id);
            const addedQty = parseRounded(newExpense.quantity);
            (async () => {
                try {
                    const { data } = await supabase.from('products').select('quantite').eq('id', prodId).single();
                    if (data) {
                        await supabase.from('products').update({
                            quantite: (data.quantite || 0) + addedQty
                        }).eq('id', prodId);
                    }
                } catch (e) {
                    console.warn('Supabase stock update error:', e);
                }
            })();

            toast.success('Achat d\'ingrédient enregistré !');
            resetForm();
            return;
        }

        // Handle regular expense
        if (!newExpense.nom || !newExpense.montant) {
            toast.warning('Champs manquants');
            return;
        }

        if (isLocalhost) {
            try {
                const res = await fetch('http://localhost:8000/expenses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...newExpense,
                        montant: parseRounded(newExpense.montant)
                    })
                });

                if (res.ok) {
                    toast.success('Charge ajoutée');
                    resetForm();
                    fetchData();
                    return;
                }
            } catch (err) {
                console.warn(err);
            }
        }

        // Cloud persistence:
        const expItem: Expense = {
            id: Date.now(),
            nom: newExpense.nom,
            type: newExpense.type,
            montant: parseRounded(newExpense.montant),
            date: newExpense.date,
            recurrence: newExpense.recurrence
        };
        const updated = [expItem, ...expenses];
        setExpenses(updated);
        localStorage.setItem('bsc_cloud_expenses', JSON.stringify(updated));
        toast.success('Charge ajoutée');
        resetForm();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer cette charge ?')) return;
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
        if (isLocalhost) {
            try {
                const token = localStorage.getItem('access_token');
                await fetch(`http://localhost:8000/expenses/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => null);
            } catch (err) {
                console.warn(err);
            }
        }

        const updated = expenses.filter(e => e.id !== id);
        setExpenses(updated);
        localStorage.setItem('bsc_cloud_expenses', JSON.stringify(updated));
        toast.success('Supprimé');
    };

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id === parseInt(productId));
        if (product) {
            setNewExpense({
                ...newExpense,
                product_id: productId,
                prix_achat: product.cout_unitaire.toString()
            });
        } else {
            setNewExpense({ ...newExpense, product_id: productId });
        }
    };

    const resetForm = () => {
        setNewExpense({
            nom: '',
            type: 'FIXE',
            montant: '',
            date: new Date().toISOString().slice(0, 10),
            recurrence: 'AUCUNE',
            product_id: '',
            quantity: '',
            prix_achat: ''
        });
    };

    const totalFixed = expenses.filter(e => e.type === 'FIXE').reduce((sum, e) => sum + e.montant, 0);
    const totalVariable = expenses.filter(e => e.type === 'VARIABLE').reduce((sum, e) => sum + e.montant, 0);
    const totalIngredients = expenses.filter(e => e.type === 'INGREDIENT_PURCHASE').reduce((sum, e) => sum + e.montant, 0);
    const totalOther = expenses.filter(e => !['FIXE', 'VARIABLE', 'INGREDIENT_PURCHASE'].includes(e.type)).reduce((sum, e) => sum + e.montant, 0);
    const totalExpenses = totalFixed + totalVariable + totalIngredients + totalOther;
    const estimatedProfit = monthlyRevenue - totalExpenses;

    const getExpenseTypeLabel = (type: string) => {
        switch (type) {
            case 'FIXE': return 'Charge Fixe';
            case 'VARIABLE': return 'Charge Variable';
            case 'INGREDIENT_PURCHASE': return 'Achat Ingrédient';
            default: return 'Autre';
        }
    };

    const getExpenseTypeColor = (type: string) => {
        switch (type) {
            case 'FIXE': return 'blue.100'; // '#e2e8f0'
            case 'VARIABLE': return 'red.100'; // '#fed7d7'
            case 'INGREDIENT_PURCHASE': return 'green.100'; // '#c6f6d5'
            default: return 'yellow.100'; // '#fef3c7'
        }
    };

    if (loading && expenses.length === 0) {
        return (
            <Flex p={20} justify="center" align="center" direction="column" gap={4}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text fontWeight="bold" color="blue.600">Chargement des charges...</Text>
            </Flex>
        );
    }



    return (
        <Box p={{ base: 2, md: 6 }} maxWidth="1200px" margin="0 auto">
            {/* Header / Period Selector */}
            <Card variant="outline" mb={8} borderRadius="2xl" boxShadow="xl" bg="white" border="none">
                <CardBody p={{ base: 4, md: 8 }}>
                    <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} mb={6} gap={4}>
                        <HStack>
                            <Icon as={MdAttachMoney} boxSize={8} color="blue.600" />
                            <Heading size="lg" color="blue.900">Gestion des Charges</Heading>
                        </HStack>
                        <Stack direction="row" spacing={3}>
                            <Select size="md" value={month} onChange={(e) => setMonth(+e.target.value)} borderRadius="xl">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('fr-FR', { month: 'long' })}</option>
                                ))}
                            </Select>
                            <Select size="md" value={year} onChange={(e) => setYear(+e.target.value)} borderRadius="xl">
                                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </Select>
                            <IconButton aria-label="Refresh" icon={<MdRefresh />} onClick={fetchData} colorScheme="blue" borderRadius="xl" />
                        </Stack>
                    </Flex>

                    {/* KPI Cards */}
                    <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
                        <Box bgGradient="linear(to-br, #48bb78, #38a169)" p={6} borderRadius="2xl" color="white" boxShadow="lg">
                            <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" opacity={0.9} fontWeight="600">Revenu</Text>
                                <Icon as={MdAttachMoney} />
                            </HStack>
                            <Text fontSize="2xl" fontWeight="800">{formatCurrency(monthlyRevenue)}</Text>
                        </Box>
                        <Box bgGradient="linear(to-br, #f56565, #e53e3e)" p={6} borderRadius="2xl" color="white" boxShadow="lg">
                            <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" opacity={0.9} fontWeight="600">Charges</Text>
                                <Icon as={MdPieChart} />
                            </HStack>
                            <Text fontSize="2xl" fontWeight="800">{formatCurrency(totalExpenses)}</Text>
                            <Text fontSize="xs" mt={1}>Fixes: {formatCurrency(totalFixed)} | Var: {formatCurrency(totalVariable)}</Text>
                        </Box>
                        <Box bgGradient={`linear(to-br, ${estimatedProfit >= 0 ? '#4299e1, #3182ce' : '#ed8936, #dd6b20'})`} p={6} borderRadius="2xl" color="white" boxShadow="lg">
                            <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" opacity={0.9} fontWeight="600">Résultat Net</Text>
                                <Icon as={MdShowChart} />
                            </HStack>
                            <Text fontSize="2xl" fontWeight="800">{formatCurrency(estimatedProfit)}</Text>
                        </Box>
                    </SimpleGrid>
                </CardBody>
            </Card>

            {/* Add Expense Form */}
            <Card variant="outline" mb={8} borderRadius="2xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
                <CardBody p={{ base: 4, md: 8 }}>
                    <Heading size="md" mb={6} color="blue.900">➕ Nouvelle Charge</Heading>
                    <Stack spacing={6}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <FormControl>
                                <FormLabel fontWeight="700">Type de Charge</FormLabel>
                                <Select
                                    size="lg"
                                    borderRadius="xl"
                                    value={newExpense.type}
                                    onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                                >
                                    <option value="FIXE">Charge Fixe</option>
                                    <option value="VARIABLE">Charge Variable</option>
                                    <option value="INGREDIENT_PURCHASE">Achat Ingrédient</option>
                                    <option value="AUTRE">Autre</option>
                                </Select>
                            </FormControl>

                            {newExpense.type === 'INGREDIENT_PURCHASE' ? (
                                <>
                                    <FormControl>
                                        <FormLabel fontWeight="700">Ingrédient</FormLabel>
                                        <Select
                                            size="lg"
                                            borderRadius="xl"
                                            value={newExpense.product_id}
                                            onChange={(e) => handleProductChange(e.target.value)}
                                        >
                                            <option value="">Sélectionner...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontWeight="700">Quantité</FormLabel>
                                        <Input
                                            size="lg"
                                            borderRadius="xl"
                                            type="number"
                                            step="0.01"
                                            value={newExpense.quantity}
                                            onChange={(e) => setNewExpense({ ...newExpense, quantity: e.target.value })}
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontWeight="700">Prix d'achat (DT/unité)</FormLabel>
                                        <Input
                                            size="lg"
                                            borderRadius="xl"
                                            type="number"
                                            step="0.01"
                                            value={newExpense.prix_achat}
                                            onChange={(e) => setNewExpense({ ...newExpense, prix_achat: e.target.value })}
                                        />
                                    </FormControl>
                                </>
                            ) : (
                                <>
                                    <FormControl>
                                        <FormLabel fontWeight="700">Nom / Description</FormLabel>
                                        <Input
                                            size="lg"
                                            borderRadius="xl"
                                            placeholder="Ex: Loyer, Électricité..."
                                            value={newExpense.nom}
                                            onChange={(e) => setNewExpense({ ...newExpense, nom: e.target.value })}
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontWeight="700">Montant (DT)</FormLabel>
                                        <Input
                                            size="lg"
                                            borderRadius="xl"
                                            type="number"
                                            step="0.01"
                                            value={newExpense.montant}
                                            onChange={(e) => setNewExpense({ ...newExpense, montant: e.target.value })}
                                        />
                                    </FormControl>
                                </>
                            )}

                            <FormControl>
                                <FormLabel fontWeight="700">Date</FormLabel>
                                <Input
                                    size="lg"
                                    borderRadius="xl"
                                    type="date"
                                    value={newExpense.date}
                                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                />
                            </FormControl>
                        </SimpleGrid>

                        <Button
                            size="lg"
                            h="60px"
                            colorScheme="emerald"
                            bgGradient="linear(to-r, #10b981, #059669)"
                            color="white"
                            borderRadius="xl"
                            leftIcon={<MdAdd />}
                            onClick={handleAddExpense}
                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                            _active={{ transform: 'translateY(0)' }}
                        >
                            Ajouter la charge
                        </Button>
                    </Stack>
                </CardBody>
            </Card>

            {/* Expenses List */}
            <Card variant="outline" borderRadius="2xl" border="1px solid" borderColor="gray.100" boxShadow="sm" overflow="hidden">
                <Box p={6} borderBottom="1px solid" borderColor="gray.50">
                    <Heading size="md" color="blue.900">📋 Liste des Charges {month}/{year}</Heading>
                </Box>
                <CardBody p={0}>
                    {isMobile ? (
                        <VStack spacing={0} align="stretch" divider={<Divider />}>
                            {expenses.length === 0 ? (
                                <Text p={8} textAlign="center" color="gray.500">Aucune charge ce mois-ci</Text>
                            ) : (
                                expenses.map(exp => (
                                    <Box key={exp.id} p={4} _hover={{ bg: "gray.30" }}>
                                        <Flex justify="space-between" mb={2}>
                                            <VStack align="start" spacing={0}>
                                                <Text fontWeight="bold" color="blue.900">{exp.nom}</Text>
                                                <Text fontSize="xs" color="gray.500">{new Date(exp.date).toLocaleDateString('fr-FR')}</Text>
                                            </VStack>
                                            <Badge
                                                borderRadius="full"
                                                px={3}
                                                py={1}
                                                bg={getExpenseTypeColor(exp.type)}
                                                variant="subtle"
                                                fontSize="xs"
                                            >
                                                {getExpenseTypeLabel(exp.type)}
                                            </Badge>
                                        </Flex>
                                        <Flex justify="space-between" align="center">
                                            <VStack align="start" spacing={0}>
                                                <Text fontSize="xl" fontWeight="800" color="emerald.600">{formatCurrency(exp.montant)}</Text>
                                                {exp.quantite && (
                                                    <Text fontSize="xs" color="gray.500">
                                                        {formatQuantity(exp.quantite)} {exp.unite || 'kg'}
                                                    </Text>
                                                )}
                                            </VStack>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                colorScheme="red"
                                                leftIcon={<MdDelete />}
                                                onClick={() => handleDelete(exp.id)}
                                            >
                                                Supprimer
                                            </Button>
                                        </Flex>
                                    </Box>
                                ))
                            )}
                        </VStack>
                    ) : (
                        <TableContainer>
                            <Table variant="simple">
                                <Thead bg="gray.50">
                                    <Tr>
                                        <Th>Produit / Description</Th>
                                        <Th>Quantité</Th>
                                        <Th isNumeric>Montant</Th>
                                        <Th>Type</Th>
                                        <Th>Date</Th>
                                        <Th textAlign="center">Action</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {expenses.length === 0 ? (
                                        <Tr>
                                            <Td colSpan={6} py={10} textAlign="center" color="gray.500">Aucune charge ce mois-ci</Td>
                                        </Tr>
                                    ) : (
                                        expenses.map(exp => (
                                            <Tr key={exp.id} _hover={{ bg: "gray.50" }}>
                                                <Td fontWeight="bold" color="blue.900">
                                                    {exp.nom.replace(/^Achat: /, '').split(' x')[0].split(' (')[0]}
                                                </Td>
                                                <Td fontSize="sm" color="gray.600">
                                                    {exp.quantite ? `${formatQuantity(exp.quantite)} ${exp.unite || 'kg'}` : '-'}
                                                </Td>
                                                <Td isNumeric fontWeight="800" color="red.600">{formatCurrency(exp.montant)}</Td>
                                                <Td>
                                                    <Badge borderRadius="full" px={3} bg={getExpenseTypeColor(exp.type)}>
                                                        {getExpenseTypeLabel(exp.type)}
                                                    </Badge>
                                                </Td>
                                                <Td fontSize="xs">{new Date(exp.date).toLocaleDateString('fr-FR')}</Td>
                                                <Td textAlign="center">
                                                    <IconButton
                                                        aria-label="Delete"
                                                        icon={<MdDelete />}
                                                        size="sm"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(exp.id)}
                                                    />
                                                </Td>
                                            </Tr>
                                        ))
                                    )}
                                </Tbody>
                                {expenses.length > 0 && (
                                    <Thead bg="gray.100">
                                        <Tr>
                                            <Th fontWeight="900" color="blue.900">TOTAL DES CHARGES</Th>
                                            <Th></Th>
                                            <Th isNumeric fontWeight="900" color="red.600" fontSize="lg">
                                                {formatCurrency(totalExpenses)}
                                            </Th>
                                            <Th colSpan={3}></Th>
                                        </Tr>
                                    </Thead>
                                )}


                            </Table>
                        </TableContainer>
                    )}
                </CardBody>
            </Card>
        </Box>
    );
}
