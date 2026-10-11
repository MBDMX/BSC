import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Box,
    Button,
    Flex,
    Icon,
    Text,
    SimpleGrid,
    Container,
    Heading,
    useToast,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Card,
    CardBody,
    Stack,
    HStack,
    VStack,
    Divider,
    TableContainer,
    Spinner,
    Badge,
} from '@chakra-ui/react';
import {
    MdPictureAsPdf,
    MdAssessment,
    MdCalendarToday,
    MdLayers,
    MdTrendingUp,
    MdAttachMoney,
    MdReceipt,
} from 'react-icons/md';
import { FiDollarSign, FiShoppingBag, FiArrowDownLeft, FiCheckCircle } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../utils/formatters';

interface Summary {
    revenue: number;
    transaction_count: number;
    total_items: number;
}

interface Transaction {
    id: number;
    produit_nom: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
    date: string;
}

interface MonthlyData {
    summary: Summary;
    transactions: Transaction[];
}

interface ChargesData {
    charges_fixes: number;
    charges_variables: number;
    charges_ingredients: number;
    charges_autres: number;
    total_charges: number;
    nombre_charges: number;
}

interface Expense {
    id: number;
    nom: string;
    type: string;
    montant: number;
    date: string;
}

export default function MonthlyReport() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<MonthlyData | null>(null);
    const [chargesData, setChargesData] = useState<ChargesData | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Months array for display
    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    useEffect(() => {
        fetchMonthlyData();
    }, [selectedMonth, selectedYear]);

    const fetchMonthlyData = async () => {
        setLoading(true);
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
        if (isLocalhost) {
            try {
                const token = localStorage.getItem('access_token');
                // Parallel fetching for speed
                const [salesRes, chargesRes, expensesRes] = await Promise.all([
                    fetch(`http://localhost:8000/sales-monthly?year=${selectedYear}&month=${selectedMonth}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`http://localhost:8000/charges-by-period?year=${selectedYear}&month=${selectedMonth}&period_type=month`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`http://localhost:8000/expenses/${selectedYear}/${selectedMonth}`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (salesRes.ok) {
                    setData(await salesRes.json());
                }

                if (chargesRes.ok) {
                    const chargesArray = await chargesRes.json();
                    if (chargesArray.length > 0) {
                        setChargesData(chargesArray[0]);
                    } else {
                        setChargesData({
                            charges_fixes: 0,
                            charges_variables: 0,
                            charges_ingredients: 0,
                            charges_autres: 0,
                            total_charges: 0,
                            nombre_charges: 0
                        });
                    }
                }

                if (expensesRes.ok) {
                    setExpenses(await expensesRes.json());
                }
                setLoading(false);
                return;
            } catch (error) {
                console.warn('Local monthly fetch notice:', error);
            }
        }

        // Cloud Supabase fallback — no demo data:
        try {
            // Fetch real sales from Supabase
            const { data: supSales } = await supabase
                .from('sales')
                .select('*')
                .gte('date', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`)
                .lte('date', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`);

            const cloudSales = supSales || [];
            const totalRev = cloudSales.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);
            const totalItems = cloudSales.reduce((acc: number, curr: any) => acc + (curr.quantite || 0), 0);

            setData({
                summary: {
                    revenue: totalRev,
                    transaction_count: cloudSales.length,
                    total_items: totalItems
                },
                transactions: cloudSales
            });

            // Fetch real expenses from Supabase
            const { data: supExp } = await supabase
                .from('expenses')
                .select('*')
                .eq('year', selectedYear)
                .eq('month', selectedMonth);

            const cloudExp = supExp || [];
            setExpenses(cloudExp);

            const fixes = cloudExp.filter((e: any) => e.type === 'FIXE').reduce((s: number, e: any) => s + e.montant, 0);
            const variables = cloudExp.filter((e: any) => e.type === 'VARIABLE').reduce((s: number, e: any) => s + e.montant, 0);
            const ingredients = cloudExp.filter((e: any) => e.type === 'INGREDIENT_PURCHASE').reduce((s: number, e: any) => s + e.montant, 0);
            const autres = cloudExp.filter((e: any) => !['FIXE', 'VARIABLE', 'INGREDIENT_PURCHASE'].includes(e.type)).reduce((s: number, e: any) => s + e.montant, 0);

            setChargesData({
                charges_fixes: fixes,
                charges_variables: variables,
                charges_ingredients: ingredients,
                charges_autres: autres,
                total_charges: fixes + variables + ingredients + autres,
                nombre_charges: cloudExp.length
            });
        } catch (e) {
            console.warn(e);
            setData({ summary: { revenue: 0, transaction_count: 0, total_items: 0 }, transactions: [] });
            setExpenses([]);
            setChargesData({ charges_fixes: 0, charges_variables: 0, charges_ingredients: 0, charges_autres: 0, total_charges: 0, nombre_charges: 0 });
        } finally {
            setLoading(false);
        }
    };

    const normalizeText = (text: string) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 \.,\(\)\-\%\/]/g, "").trim();
    };

    const handleExportPDF = () => {
        if (!data) return;

        const doc = new jsPDF();
        const monthName = months[selectedMonth - 1];

        // Header
        doc.setFillColor(3, 34, 76);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text(normalizeText("BURGER SOCIAL CLUB - BILAN MENSUEL"), 20, 25);
        doc.setFontSize(14);
        doc.text(normalizeText(`Periode: ${monthName} ${selectedYear}`), 20, 35);

        // KPI Summary - LARGE AND BOLD
        doc.setTextColor(3, 34, 76);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(normalizeText("INDICATEURS CLES"), 20, 55);

        const totalCharges = chargesData?.total_charges || 0;
        const profit = data.summary.revenue - totalCharges;

        // Create large, bold KPI table
        autoTable(doc, {
            startY: 62,
            head: [[
                normalizeText('Chiffre d\'Affaires'),
                normalizeText('Total Charges'),
                normalizeText('Resultat Net'),
                normalizeText('Transactions')
            ]],
            body: [[
                `${data.summary.revenue.toFixed(2)} DT`,
                `${totalCharges.toFixed(2)} DT`,
                `${profit.toFixed(2)} DT`,
                `${data.summary.transaction_count}`
            ]],
            theme: 'grid',
            headStyles: {
                fillColor: [3, 34, 76],
                font: 'helvetica',
                fontStyle: 'bold',
                fontSize: 11,
                halign: 'center'
            },
            bodyStyles: {
                font: 'helvetica',
                fontStyle: 'bold',
                fontSize: 14,
                halign: 'center',
                cellPadding: 8,
                textColor: [3, 34, 76]
            },
            columnStyles: {
                0: { fillColor: [220, 252, 231] }, // Green for revenue
                1: { fillColor: [254, 226, 226] }, // Red for charges
                2: { fillColor: profit >= 0 ? [219, 234, 254] : [254, 215, 170] }, // Blue/Orange for profit
                3: { fillColor: [243, 244, 246] }  // Gray for transactions
            }
        });

        // Unified Purchases and Sales Table
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        const unifiedY = (doc as any).lastAutoTable.finalY + 15;
        doc.text(normalizeText("DETAIL DES OPERATIONS"), 20, unifiedY);

        // Prepare unified data
        const unifiedData: any[] = [];

        // Add charges/purchases
        if (expenses && expenses.length > 0) {
            expenses.forEach((exp: any) => {
                unifiedData.push([
                    new Date(exp.date).toLocaleDateString('fr-FR'),
                    normalizeText(exp.nom),
                    normalizeText(exp.type === 'FIXE' ? 'Charge Fixe' :
                        exp.type === 'VARIABLE' ? 'Charge Variable' :
                            exp.type === 'INGREDIENT_PURCHASE' ? 'Achat Ingredient' : 'Autre Charge'),
                    exp.quantite ? `${exp.quantite} ${exp.unite || ''}` : '',
                    `${exp.montant.toFixed(2)} DT`,
                    '-' // Negative for charges
                ]);
            });
        }

        // Add sales
        if (data.transactions && data.transactions.length > 0) {
            data.transactions.forEach((t: any) => {
                unifiedData.push([
                    new Date(t.date).toLocaleDateString('fr-FR'),
                    normalizeText(t.produit_nom),
                    'Vente',
                    `${t.quantite}`,
                    `${t.total.toFixed(2)} DT`,
                    '+' // Positive for sales
                ]);
            });
        }

        // Sort by date
        unifiedData.sort((a, b) => {
            const dateA = new Date(a[0].split('/').reverse().join('-'));
            const dateB = new Date(b[0].split('/').reverse().join('-'));
            return dateA.getTime() - dateB.getTime();
        });

        autoTable(doc, {
            startY: unifiedY + 5,
            head: [[
                normalizeText('Date'),
                normalizeText('Description'),
                normalizeText('Type'),
                normalizeText('Qte'),
                normalizeText('Montant'),
                normalizeText('+/-')
            ]],
            body: unifiedData,
            theme: 'striped',
            headStyles: {
                fillColor: [3, 34, 76],
                font: 'helvetica',
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                font: 'helvetica',
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 35, fontSize: 8 },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
                5: { cellWidth: 12, halign: 'center', fontStyle: 'bold' }
            },
            didParseCell: function (data: any) {
                // Color code the +/- column
                if (data.column.index === 5) {
                    if (data.cell.raw === '+') {
                        data.cell.styles.textColor = [16, 185, 129]; // Green
                    } else if (data.cell.raw === '-') {
                        data.cell.styles.textColor = [239, 68, 68]; // Red
                    }
                }
            }
        });

        // Save
        const fileName = `Bilan_${monthName}_${selectedYear}.pdf`;
        doc.save(fileName);
        toast({ title: "PDF Exporté", status: "success", duration: 3000 });
    };

    return (
        <Box minH="100vh" bg="gray.50" py={{ base: 6, md: 10 }} px={{ base: 4, md: 10 }}>
            <Container maxW="container.xl">
                <Card
                    variant="elevated"
                    borderRadius="3xl"
                    overflow="hidden"
                    shadow="xl"
                    border="1px solid"
                    borderColor="gray.100"
                    bg="white"
                >
                    <CardBody p={{ base: 6, md: 10 }}>
                        {/* Header */}
                        <Flex
                            direction={{ base: 'column', lg: 'row' }}
                            justify="space-between"
                            align={{ base: 'stretch', lg: 'center' }}
                            gap={6}
                            mb={10}
                        >
                            <VStack align="flex-start" spacing={1}>
                                <Heading color="#03224c" size="lg" fontWeight="black" display="flex" alignItems="center" gap={3}>
                                    <Icon as={MdAssessment} color="blue.500" />
                                    Bilan Mensuel
                                </Heading>
                                <Text color="gray.500">Récapitulatif financier de votre activité.</Text>
                            </VStack>

                            <Flex
                                direction={{ base: 'column', sm: 'row' }}
                                gap={3}
                                align={{ base: 'stretch', sm: 'center' }}
                            >
                                <HStack spacing={2} bg="gray.50" p={1.5} borderRadius="xl" border="1px solid" borderColor="gray.200">
                                    <Select
                                        variant="ghost"
                                        size="sm"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        fontWeight="bold"
                                        cursor="pointer"
                                    >
                                        {months.map((m, idx) => (
                                            <option key={idx} value={idx + 1}>{m}</option>
                                        ))}
                                    </Select>
                                    <Divider orientation="vertical" h="20px" borderColor="gray.300" />
                                    <Select
                                        variant="ghost"
                                        size="sm"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        fontWeight="bold"
                                        cursor="pointer"
                                        w="90px"
                                    >
                                        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </Select>
                                </HStack>

                                <Button
                                    leftIcon={<MdPictureAsPdf />}
                                    colorScheme="red"
                                    size="sm"
                                    borderRadius="xl"
                                    onClick={handleExportPDF}
                                    isDisabled={!data || data.transactions.length === 0}
                                    isLoading={loading}
                                    boxShadow="0 4px 12px rgba(229, 62, 62, 0.2)"
                                >
                                    Export PDF
                                </Button>
                            </Flex>
                        </Flex>

                        {loading ? (
                            <Flex justify="center" align="center" py={20}>
                                <Spinner size="xl" thickness="4px" color="blue.500" />
                            </Flex>
                        ) : data ? (
                            <>
                                {/* KPI CARDS */}
                                <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={10}>
                                    {/* Revenu */}
                                    <Card
                                        borderRadius="2xl"
                                        bgGradient="linear(to-br, green.400, green.600)"
                                        color="white"
                                        shadow="lg"
                                        border="none"
                                        _hover={{ transform: 'translateY(-5px)' }}
                                        transition="0.3s"
                                    >
                                        <CardBody p={5}>
                                            <VStack align="flex-start" spacing={3}>
                                                <Flex p={2} bg="whiteAlpha.300" borderRadius="lg">
                                                    <Icon as={FiDollarSign} boxSize={6} />
                                                </Flex>
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="bold" opacity={0.9} textTransform="uppercase" letterSpacing="wide">Recettes</Text>
                                                    <Heading size="lg" fontWeight="black">{formatCurrency(data.summary.revenue)}</Heading>
                                                </Box>
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    {/* Charges */}
                                    <Card
                                        borderRadius="2xl"
                                        bgGradient="linear(to-br, red.400, red.600)"
                                        color="white"
                                        shadow="lg"
                                        border="none"
                                        _hover={{ transform: 'translateY(-5px)' }}
                                        transition="0.3s"
                                    >
                                        <CardBody p={5}>
                                            <VStack align="flex-start" spacing={3}>
                                                <Flex p={2} bg="whiteAlpha.300" borderRadius="lg">
                                                    <Icon as={FiArrowDownLeft} boxSize={6} />
                                                </Flex>
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="bold" opacity={0.9} textTransform="uppercase" letterSpacing="wide">Charges</Text>
                                                    <Heading size="lg" fontWeight="black">{formatCurrency(chargesData?.total_charges || 0)}</Heading>
                                                    <Text fontSize="xs" mt={1} opacity={0.8}>{chargesData?.nombre_charges || 0} opérations</Text>
                                                </Box>
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    {/* Résultat */}
                                    <Card
                                        borderRadius="2xl"
                                        bgGradient={(data.summary.revenue - (chargesData?.total_charges || 0)) >= 0
                                            ? "linear(to-br, blue.400, teal.500)"
                                            : "linear(to-br, orange.400, red.500)"
                                        }
                                        color="white"
                                        shadow="lg"
                                        border="none"
                                        _hover={{ transform: 'translateY(-5px)' }}
                                        transition="0.3s"
                                    >
                                        <CardBody p={5}>
                                            <VStack align="flex-start" spacing={3}>
                                                <Flex p={2} bg="whiteAlpha.300" borderRadius="lg">
                                                    <Icon as={FiCheckCircle} boxSize={6} />
                                                </Flex>
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="bold" opacity={0.9} textTransform="uppercase" letterSpacing="wide">Résultat Net</Text>
                                                    <Heading size="lg" fontWeight="black">{formatCurrency(data.summary.revenue - (chargesData?.total_charges || 0))}</Heading>
                                                </Box>
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    {/* Commandes */}
                                    <Card
                                        borderRadius="2xl"
                                        bg="white"
                                        color="#03224c"
                                        shadow="md"
                                        border="1px solid"
                                        borderColor="gray.100"
                                        _hover={{ transform: 'translateY(-5px)' }}
                                        transition="0.3s"
                                    >
                                        <CardBody p={5}>
                                            <VStack align="flex-start" spacing={3}>
                                                <Flex p={2} bg="gray.100" borderRadius="lg" color="indigo.500">
                                                    <Icon as={FiShoppingBag} boxSize={6} />
                                                </Flex>
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wide">Transactions</Text>
                                                    <Heading size="lg" fontWeight="black">{data.summary.transaction_count}</Heading>
                                                </Box>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                </SimpleGrid>

                                <Stack spacing={10}>
                                    {/* Charges Breakdown Section */}
                                    {chargesData && chargesData.total_charges > 0 && (
                                        <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100">
                                            <Box p={6} borderBottom="1px solid" borderColor="gray.50">
                                                <Heading size="sm" fontWeight="bold" color="#03224c" display="flex" alignItems="center" gap={2}>
                                                    💰 Répartition des Charges
                                                </Heading>
                                            </Box>
                                            <Box p={6}>
                                                <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={8}>
                                                    {[
                                                        { label: 'Fixes', val: chargesData.charges_fixes, color: 'blue' },
                                                        { label: 'Variables', val: chargesData.charges_variables, color: 'red' },
                                                        { label: 'Ingrédients', val: chargesData.charges_ingredients, color: 'green' },
                                                        { label: 'Autres', val: chargesData.charges_autres, color: 'orange' }
                                                    ].map(c => (
                                                        <Box key={c.label} p={4} bg={`${c.color}.50`} borderRadius="xl" border="1px solid" borderColor={`${c.color}.100`}>
                                                            <Text fontSize="xs" fontWeight="bold" color={`${c.color}.600`} mb={1} textTransform="uppercase">{c.label}</Text>
                                                            <Text fontSize="lg" fontWeight="black" color="#03224c">{formatCurrency(c.val)}</Text>
                                                        </Box>
                                                    ))}
                                                </SimpleGrid>

                                                {/* Detailed Expenses List */}
                                                {expenses.length > 0 && (
                                                    <Box>
                                                        <Text fontSize="sm" fontWeight="bold" mb={4} color="gray.500">DÉTAIL DES CHARGES ({expenses.length})</Text>
                                                        <TableContainer border="1px solid" borderColor="gray.100" borderRadius="xl">
                                                            <Table variant="simple" size="sm">
                                                                <Thead bg="gray.50">
                                                                    <Tr>
                                                                        <Th color="gray.400" textTransform="none">Date</Th>
                                                                        <Th color="gray.400" textTransform="none">Nom</Th>
                                                                        <Th color="gray.400" textTransform="none">Type</Th>
                                                                        <Th isNumeric color="gray.400" textTransform="none">Montant</Th>
                                                                    </Tr>
                                                                </Thead>
                                                                <Tbody>
                                                                    {expenses.map((exp) => (
                                                                        <Tr key={exp.id} _hover={{ bg: "gray.50" }}>
                                                                            <Td fontSize="xs" color="gray.500">{new Date(exp.date).toLocaleDateString('fr-FR')}</Td>
                                                                            <Td fontSize="sm" fontWeight="bold" color="#03224c">{exp.nom}</Td>
                                                                            <Td>
                                                                                <Badge
                                                                                    size="sm"
                                                                                    variant="subtle"
                                                                                    colorScheme={
                                                                                        exp.type === 'FIXE' ? 'blue' :
                                                                                            exp.type === 'VARIABLE' ? 'red' :
                                                                                                exp.type === 'INGREDIENT_PURCHASE' ? 'green' : 'yellow'
                                                                                    }
                                                                                    borderRadius="full"
                                                                                    px={2}
                                                                                >
                                                                                    {exp.type === 'FIXE' ? 'Fixe' : exp.type === 'VARIABLE' ? 'Variable' : exp.type === 'INGREDIENT_PURCHASE' ? 'Ingrédient' : 'Autre'}
                                                                                </Badge>
                                                                            </Td>
                                                                            <Td isNumeric fontWeight="black" color="red.500">{formatCurrency(exp.montant)}</Td>
                                                                        </Tr>
                                                                    ))}
                                                                </Tbody>
                                                            </Table>
                                                        </TableContainer>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Sales Detail Section */}
                                    <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100">
                                        <Box p={6} borderBottom="1px solid" borderColor="gray.50">
                                            <Heading size="sm" fontWeight="bold" color="#03224c" display="flex" alignItems="center" gap={2}>
                                                📊 Détails des Ventes
                                            </Heading>
                                        </Box>
                                        <Box p={6}>
                                            <TableContainer border="1px solid" borderColor="gray.100" borderRadius="xl" maxHeight="500px" overflowY="auto">
                                                <Table variant="simple" size="sm">
                                                    <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                                                        <Tr>
                                                            <Th color="gray.400" textTransform="none">Date & Heure</Th>
                                                            <Th color="gray.400" textTransform="none">Produit</Th>
                                                            <Th isNumeric color="gray.400" textTransform="none">Quantité</Th>
                                                            <Th isNumeric color="gray.400" textTransform="none">Total</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {data.transactions.length === 0 ? (
                                                            <Tr>
                                                                <Td colSpan={4} textAlign="center" py={12}>
                                                                    <VStack spacing={2} opacity={0.5}>
                                                                        <Icon as={MdLayers} boxSize={10} />
                                                                        <Text fontSize="sm">Aucune vente enregistrée ce mois-ci.</Text>
                                                                    </VStack>
                                                                </Td>
                                                            </Tr>
                                                        ) : (
                                                            data.transactions.map((t) => (
                                                                <Tr key={t.id} _hover={{ bg: "gray.50" }}>
                                                                    <Td fontSize="xs" color="gray.500">
                                                                        {new Date(t.date).toLocaleString('fr-FR', {
                                                                            day: '2-digit', month: '2-digit',
                                                                            hour: '2-digit', minute: '2-digit'
                                                                        })}
                                                                    </Td>
                                                                    <Td fontSize="sm" fontWeight="bold" color="#03224c">{t.produit_nom}</Td>
                                                                    <Td isNumeric fontWeight="medium">{t.quantite}</Td>
                                                                    <Td isNumeric fontWeight="black" color="green.600">{t.total.toFixed(2)} DT</Td>
                                                                </Tr>
                                                            ))
                                                        )}
                                                    </Tbody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    </Box>
                                </Stack>
                            </>
                        ) : (
                            <Flex direction="column" align="center" justify="center" py={20}>
                                <Icon as={MdLayers} boxSize={12} color="red.200" mb={4} />
                                <Text color="red.500" fontWeight="bold">Erreur de chargement des données financière.</Text>
                                <Button mt={4} size="sm" onClick={fetchMonthlyData}>Réessayer</Button>
                            </Flex>
                        )}
                    </CardBody>
                </Card>
            </Container>
        </Box>
    );
}
