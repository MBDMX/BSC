import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Icon,
    useToast,
    Image,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    SimpleGrid,
    Card,
    CardBody,
    Flex,
    Spinner,
    IconButton,
    useDisclosure
} from '@chakra-ui/react';
import { Select } from '@chakra-ui/react';
import { MdCloudUpload, MdCheck, MdReceipt, MdVisibility, MdWarning, MdDelete, MdSave, MdAdd, MdRemove } from 'react-icons/md';
import { formatCurrency } from '../utils/formatters';

interface InvoiceItem {
    id?: number;
    product_id: number | null;
    product_name: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
}

interface Invoice {
    id: number;
    filename: string;
    supplier_name: string;
    total_amount: number;
    invoice_date: string;
    status: 'draft' | 'confirmed';
    image_path: string;
    date_upload: string;
}

import { supabase } from '../lib/supabaseClient';

export default function InvoiceManager() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [editData, setEditData] = useState({ supplier_name: '', total_amount: 0, date: '' });

    const { isOpen, onOpen, onClose } = useDisclosure();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
    const API_URL = isLocalhost ? 'http://localhost:8000' : '';

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchInvoices(),
                    fetchAllProducts()
                ]);
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);

    const fetchAllProducts = async () => {
        try {
            if (isLocalhost) {
                try {
                    const res = await fetch(`${API_URL}/dashboard-data?include_hidden=true`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setAllProducts(data.products || []);
                        return;
                    }
                } catch (e) {
                    console.warn(e);
                }
            }

            // Supabase fallback:
            const { data: prods } = await supabase.from('products').select('*');
            if (prods) {
                setAllProducts(prods);
            }
        } catch (error) {
            console.warn('Error fetching products:', error);
        }
    };

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            if (isLocalhost) {
                try {
                    const res = await fetch(`${API_URL}/invoices`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setInvoices(data);
                        return;
                    }
                } catch (e) {
                    console.warn(e);
                }
            }

            const saved = localStorage.getItem('bsc_cloud_invoices');
            if (saved) {
                setInvoices(JSON.parse(saved));
            } else {
                setInvoices([]);
            }
        } catch (error) {
            console.warn('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/invoices/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
                body: formData
            });

            if (res.ok) {
                const result = await res.json();
                toast({
                    title: "Confirmation Automatique",
                    description: "La facture a été analysée, validée et le stock a été mis à jour automatiquement.",
                    status: "success",
                    duration: 5000
                });
                setSelectedInvoice(result);
                setEditData({
                    supplier_name: result.extracted_data.supplier_name || 'Inconnu',
                    total_amount: result.extracted_data.total_amount || 0,
                    date: result.extracted_data.invoice_date || new Date().toISOString().split('T')[0]
                });
                setInvoiceItems(result.extracted_data.items.map((it: any) => ({
                    product_id: it.product_id || null,
                    product_name: it.name,
                    quantite: it.quantity,
                    prix_unitaire: it.unit_price,
                    total: it.total
                })));
                onOpen();
                fetchInvoices();
            } else {
                const err = await res.json();
                toast({ title: "Erreur", description: err.detail, status: "error" });
            }
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible d'uploader le fichier.", status: "error" });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const confirmInvoice = async () => {
        try {
            const payload = {
                ...editData,
                items: invoiceItems
                    .filter(it => it.product_id !== null)
                    .map(it => ({
                        product_id: it.product_id,
                        product_name: it.product_name,
                        quantity: it.quantite,  // ✅ Transform quantite -> quantity
                        unit_price: it.prix_unitaire,
                        total: it.total
                    }))
            };

            const res = await fetch(`${API_URL}/invoices/${selectedInvoice.id}/confirm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast({ title: "Confirmé", description: "Dépense et stocks mis à jour.", status: "success" });
                onClose();
                fetchInvoices();
            }
        } catch (error) {
            toast({ title: "Erreur", description: "Confirmation échouée.", status: "error" });
        }
    };

    const deleteInvoice = async (id: number) => {
        if (!confirm('Voulez-vous vraiment supprimer cette facture ?')) return;
        try {
            const res = await fetch(`${API_URL}/invoices/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            if (res.ok) {
                toast({ title: "Supprimé", status: "success" });
                if (selectedInvoice?.id === id) onClose();
                fetchInvoices();
            }
        } catch (error) {
            toast({ title: "Erreur", description: "Suppression échouée.", status: "error" });
        }
    };

    const updateInvoiceMetadata = async () => {
        try {
            const res = await fetch(`${API_URL}/invoices/${selectedInvoice.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editData)
            });

            if (res.ok) {
                toast({ title: "Mis à jour", description: "Données de la facture sauvegardées.", status: "success" });
                fetchInvoices();
            }
        } catch (error) {
            toast({ title: "Erreur", description: "Mise à jour échouée.", status: "error" });
        }
    };

    return (
        <Box p={4}>
            <VStack align="stretch" spacing={6}>
                <Flex justify="space-between" align="center">
                    <Heading size="lg" color="blue.900">📚 Gestion des Factures</Heading>
                    <Button
                        leftIcon={<MdCloudUpload />}
                        colorScheme="blue"
                        isLoading={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Importer une Facture
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".pdf,.png,.jpg,.jpeg"
                    />
                </Flex>

                <Card borderRadius="2xl" boxShadow="md" overflow="hidden">
                    <CardBody p={0}>
                        <Table variant="simple">
                            <Thead bg="gray.50">
                                <Tr>
                                    <Th>Date Import</Th>
                                    <Th>Fournisseur</Th>
                                    <Th isNumeric>Montant</Th>
                                    <Th>Statut</Th>
                                    <Th textAlign="center">Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {loading ? (
                                    <Tr><Td colSpan={5} textAlign="center"><Spinner /></Td></Tr>
                                ) : invoices.length === 0 ? (
                                    <Tr><Td colSpan={5} textAlign="center">Aucune facture importée</Td></Tr>
                                ) : invoices.map(inv => (
                                    <Tr key={inv.id}>
                                        <Td fontSize="sm">{new Date(inv.date_upload).toLocaleDateString()}</Td>
                                        <Td fontWeight="bold">{inv.supplier_name || 'N/A'}</Td>
                                        <Td isNumeric fontWeight="bold">{formatCurrency(inv.total_amount)}</Td>
                                        <Td>
                                            <Badge colorScheme={inv.status === 'confirmed' ? 'green' : 'orange'}>
                                                {inv.status === 'confirmed' ? 'Confirmé' : 'Brouillon'}
                                            </Badge>
                                        </Td>
                                        <Td textAlign="center">
                                            <HStack spacing={2} justify="center">
                                                <IconButton
                                                    aria-label="Voir"
                                                    icon={<MdVisibility />}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="blue"
                                                    onClick={async () => {
                                                        setSelectedInvoice(inv);
                                                        setEditData({
                                                            supplier_name: inv.supplier_name,
                                                            total_amount: inv.total_amount,
                                                            date: inv.invoice_date
                                                        });

                                                        // Fetch items for this invoice
                                                        const itemsRes = await fetch(`${API_URL}/invoices/${inv.id}/items`, {
                                                            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                                                        });
                                                        if (itemsRes.ok) {
                                                            const items = await itemsRes.json();
                                                            setInvoiceItems(items);
                                                        }

                                                        onOpen();
                                                    }}
                                                />
                                                <IconButton
                                                    aria-label="Supprimer"
                                                    icon={<MdDelete />}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    onClick={() => deleteInvoice(inv.id)}
                                                />
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </CardBody>
                </Card>
            </VStack>

            {/* Validation Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="6xl">
                <ModalOverlay />
                <ModalContent borderRadius="2xl">
                    <ModalHeader borderBottomWidth="1px">
                        Validation de la Facture: {selectedInvoice?.filename}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody p={6}>
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                            <Box>
                                <Heading size="xs" mb={2} color="gray.500">Aperçu du texte lu (OCR) :</Heading>
                                <Box
                                    p={3}
                                    bg="gray.100"
                                    borderRadius="lg"
                                    fontSize="xs"
                                    fontFamily="monospace"
                                    maxH="200px"
                                    overflowY="auto"
                                    border="1px solid"
                                    borderColor="gray.200"
                                >
                                    {selectedInvoice?.ocr_raw_text || "Aucun texte extrait."}
                                </Box>
                                {(!invoiceItems || invoiceItems.length === 0) && (
                                    <Box mt={3} p={3} bg="red.50" borderRadius="md" borderLeft="4px solid" borderColor="red.400">
                                        <HStack color="red.700">
                                            <Icon as={MdWarning} />
                                            <Text fontSize="xs" fontWeight="bold">Attention : Aucun article n'a été détecté automatiquement. L'image est peut-être floue ou le format n'est pas reconnu.</Text>
                                        </HStack>
                                    </Box>
                                )}
                            </Box>

                            {/* Image Preview */}
                            <Box borderWidth="1px" borderRadius="xl" overflow="hidden" bg="gray.50">
                                <Image
                                    src={`${API_URL}${selectedInvoice?.image_path}`}
                                    alt="Invoice Preview"
                                    fallback={<Box p={10} textAlign="center"><Spinner /><Text mt={2}>Chargement de l'image...</Text></Box>}
                                />
                            </Box>

                            {/* Verification Form */}
                            <VStack align="stretch" spacing={6}>
                                <Heading size="md" color="blue.700">Données extraites (Ajuster si besoin)</Heading>
                                <FormControl>
                                    <FormLabel fontWeight="bold">Fournisseur</FormLabel>
                                    <Input
                                        value={editData.supplier_name}
                                        onChange={e => setEditData({ ...editData, supplier_name: e.target.value })}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontWeight="bold">Montant Total (TND)</FormLabel>
                                    <Input
                                        type="number"
                                        value={editData.total_amount}
                                        onChange={e => setEditData({ ...editData, total_amount: parseFloat(e.target.value) || 0 })}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontWeight="bold">Date de la Facture</FormLabel>
                                    <Input
                                        value={editData.date}
                                        onChange={e => setEditData({ ...editData, date: e.target.value })}
                                    />
                                </FormControl>

                                <Box p={4} bg="orange.50" borderRadius="lg" border="1px solid" borderColor="orange.200">
                                    <HStack color="orange.800">
                                        <Icon as={MdWarning} />
                                        <Text fontSize="sm">Vérifiez bien les valeurs avant de confirmer. Cela créera une dépense variable et mettra à jour les stocks.</Text>
                                    </HStack>
                                </Box>

                                {/* Items Breakdown Section */}
                                <Box mt={4}>
                                    <Heading size="sm" mb={3} color="blue.600">🛒 Articles et Stocks</Heading>
                                    <Table variant="simple" size="sm">
                                        <Thead bg="gray.100">
                                            <Tr>
                                                <Th>Désignation (Facture)</Th>
                                                <Th>Produit (Stock)</Th>
                                                <Th isNumeric>Qté</Th>
                                                <Th isNumeric>Total</Th>
                                                <Th></Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {invoiceItems.map((item, idx) => (
                                                <Tr key={idx} bg={!item.product_id ? "red.50" : "inherit"}>
                                                    <Td fontSize="xs" maxW="150px" isTruncated>{item.product_name}</Td>
                                                    <Td>
                                                        <Select
                                                            size="xs"
                                                            placeholder="Mapper au stock..."
                                                            value={item.product_id || ""}
                                                            borderColor={!item.product_id ? "red.400" : "inherit"}
                                                            borderWidth={!item.product_id ? "2px" : "1px"}
                                                            onChange={(e) => {
                                                                const newItems = [...invoiceItems];
                                                                newItems[idx].product_id = parseInt(e.target.value) || null;
                                                                setInvoiceItems(newItems);
                                                            }}
                                                        >
                                                            {allProducts
                                                                .filter(p => p.type === 'ING' || p.type === 'PREP')
                                                                .map(prod => (
                                                                    <option key={prod.id} value={prod.id}>{prod.nom}</option>
                                                                ))}
                                                        </Select>
                                                    </Td>
                                                    <Td isNumeric>
                                                        <Input
                                                            size="xs"
                                                            w="60px"
                                                            type="number"
                                                            value={item.quantite}
                                                            onChange={(e) => {
                                                                const newItems = [...invoiceItems];
                                                                newItems[idx].quantite = parseFloat(e.target.value) || 0;
                                                                setInvoiceItems(newItems);
                                                            }}
                                                        />
                                                    </Td>
                                                    <Td isNumeric>
                                                        <Input
                                                            size="xs"
                                                            w="80px"
                                                            type="number"
                                                            fontWeight="bold"
                                                            value={item.total}
                                                            onChange={(e) => {
                                                                const newItems = [...invoiceItems];
                                                                newItems[idx].total = parseFloat(e.target.value) || 0;
                                                                // Recalculate unit price if needed, although it's mostly for display
                                                                if (newItems[idx].quantite > 0) {
                                                                    newItems[idx].prix_unitaire = newItems[idx].total / newItems[idx].quantite;
                                                                }
                                                                setInvoiceItems(newItems);
                                                            }}
                                                        />
                                                    </Td>
                                                    <Td>
                                                        <IconButton
                                                            aria-label="Supprimer ligne"
                                                            icon={<MdRemove />}
                                                            size="xs"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            onClick={() => {
                                                                setInvoiceItems(invoiceItems.filter((_, i) => i !== idx));
                                                            }}
                                                        />
                                                    </Td>
                                                </Tr>
                                            ))}
                                            <Tr>
                                                <Td colSpan={5}>
                                                    <Button
                                                        leftIcon={<MdAdd />}
                                                        size="xs"
                                                        variant="ghost"
                                                        colorScheme="blue"
                                                        onClick={() => setInvoiceItems([...invoiceItems, { product_id: null, product_name: 'Nouvel article', quantite: 1, prix_unitaire: 0, total: 0 }])}
                                                    >
                                                        Ajouter un article
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        </Tbody>
                                    </Table>
                                </Box>

                                <HStack spacing={4}>
                                    <Button
                                        colorScheme="blue"
                                        variant="outline"
                                        flex={1}
                                        leftIcon={<MdSave />}
                                        onClick={updateInvoiceMetadata}
                                    >
                                        Sauvegarder
                                    </Button>
                                    <Button
                                        colorScheme="green"
                                        flex={2}
                                        leftIcon={<MdCheck />}
                                        onClick={confirmInvoice}
                                    >
                                        {selectedInvoice?.status === 'confirmed' ? 'Mettre à jour Stock & Données' : 'Confirmer et Créer la Dépense'}
                                    </Button>
                                </HStack>

                                {selectedInvoice?.status !== 'confirmed' && (
                                    <Button
                                        colorScheme="red"
                                        variant="ghost"
                                        leftIcon={<MdDelete />}
                                        onClick={() => deleteInvoice(selectedInvoice.id)}
                                    >
                                        Supprimer ce brouillon
                                    </Button>
                                )}
                            </VStack>
                        </SimpleGrid>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}
