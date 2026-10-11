import { supabase } from '../lib/supabaseClient';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { StockIngredient, EditingState } from '../types/dashboard';
import { useRouter } from 'next/router';
import { formatQuantity } from '../utils/formatters';
import ConsumptionAnalytics from './ConsumptionAnalytics';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Select,
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
  Icon,
  Collapse,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { MdAdd, MdDelete, MdSearch, MdEdit, MdRefresh, MdScience, MdCategory, MdClose, MdCheck } from 'react-icons/md';

interface MatierePremiereManagerProps {
  onDataChange?: (data: StockIngredient[]) => void;
}

export default function MatierePremiereManager({ onDataChange }: MatierePremiereManagerProps) {
  const router = useRouter();
  const [matieresPremieres, setMatieresPremieres] = useState<StockIngredient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [editingState, setEditingState] = useState<EditingState>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMatiere, setNewMatiere] = useState({
    nom: '',
    code: '',
    unite: '',
    quantite_stock: 0,
    seuil_reapprovisionnement: 0,
    prix_achat: 0,
    fournisseur: '',
    date_peremption: '',
    categorie: ''
  });

  // Charger les données depuis le backend au montage
  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    let loaded = false;
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');

    if (isLocalhost) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/dashboard-data?include_hidden=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const allProducts = data.products || [];

          const ingredients = allProducts
            .filter((p: any) => p.categorie === "Ingredient" || p.type === "PREP")
            .map((p: any) => {
              const displayQuantity = p.quantite;
              return {
                id: p.id,
                nom: p.nom,
                code: `${p.type || 'ING'}-${p.id}`,
                unite: p.unite || detectUnite(p.nom),
                quantite_stock: parseFloat(formatQuantity(displayQuantity)),
                seuil_reapprovisionnement: p.seuil,
                prix_achat: p.cout_unitaire,
                fournisseur: p.fournisseur,
                categorie: p.categorie,
                type: p.type
              };
            });
          setMatieresPremieres(ingredients);
          loaded = true;
        } else if (response.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }
      } catch (error) {
        console.warn('Local fetchIngredients error, using Supabase:', error);
      }
    }

    if (!loaded) {
      try {
        const { data: allProds } = await supabase.from('products').select('*');
        if (allProds && allProds.length > 0) {
          const ingredients = allProds
            .filter((p: any) => p.categorie === "Ingredient" || p.type === "PREP" || p.type === "ING")
            .map((p: any) => ({
              id: p.id,
              nom: p.nom,
              code: `${p.type || 'ING'}-${p.id}`,
              unite: p.unite || detectUnite(p.nom),
              quantite_stock: parseFloat(formatQuantity(p.quantite || 0)),
              seuil_reapprovisionnement: p.seuil || 10,
              prix_achat: p.cout_unitaire || 0,
              fournisseur: p.fournisseur || '',
              categorie: p.categorie || 'Ingredient',
              type: p.type || 'ING',
              created_at: new Date().toISOString()
            }));
          setMatieresPremieres(ingredients);
        }
      } catch (sbErr) {
        console.error('Supabase fetchIngredients error:', sbErr);
      }
    }
  };

  // Écouter les événements de synchronisation
  useEffect(() => {
    const handleMatieresUpdated = (e: CustomEvent) => {
      setMatieresPremieres(e.detail.matieres);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'matieresPremieres') {
        try {
          const newMatieres = e.newValue ? JSON.parse(e.newValue) : [];
          setMatieresPremieres(newMatieres);
        } catch (error) {
          console.error('Erreur lors de la synchronisation:', error);
        }
      }
    };

    window.addEventListener('matieresUpdated', handleMatieresUpdated as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('matieresUpdated', handleMatieresUpdated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Charger les données d'exemple (vide)
  const loadSampleData = () => {
    const sampleMatieres: StockIngredient[] = [];

    setMatieresPremieres(sampleMatieres);
    saveToLocalStorage(sampleMatieres);
  };

  // Fonction de détection automatique d'unité
  const detectUnite = (nom: string): string => {
    const nomLower = nom.toLowerCase();

    // Liquides
    if (nomLower.includes('huile') || nomLower.includes('eau') || nomLower.includes('lait') ||
      nomLower.includes('boisson') || nomLower.includes('soda') || nomLower.includes('jus') ||
      nomLower.includes('vinaigre') || nomLower.includes('sauce liquide')) {
      return 'L';
    }

    // Unités individuelles
    if (nomLower.includes('pain') || nomLower.includes('burger') || nomLower.includes('œuf') ||
      nomLower.includes('oeuf') || nomLower.includes('boite') || nomLower.includes('sachet') ||
      nomLower.includes('bouteille') || nomLower.includes('canette')) {
      return 'unité';
    }

    // Grammes (épices, condiments, petites quantités)
    if (nomLower.includes('épice') || nomLower.includes('epice') || nomLower.includes('sel') ||
      nomLower.includes('poivre') || nomLower.includes('herbe') || nomLower.includes('levure') ||
      nomLower.includes('colorant') || nomLower.includes('arôme') || nomLower.includes('arome')) {
      return 'g';
    }

    // Kilogrammes par défaut pour tout le reste (viandes, légumes, etc.)
    return 'kg';
  };

  // Sauvegarder dans localStorage et déclencher la synchronisation
  const saveToLocalStorage = (matieres: StockIngredient[]) => {
    localStorage.setItem('matieresPremieres', JSON.stringify(matieres));

    // Déclencher l'événement de mise à jour pour la synchronisation
    const event = new CustomEvent('matieresUpdated', {
      detail: { matieres: matieres }
    });
    window.dispatchEvent(event);

    if (onDataChange) {
      onDataChange(matieres);
    }
  };

  // Fonction pour ajouter une matière première via l'API
  const addMatiere = async () => {
    if (!newMatiere.nom || newMatiere.prix_achat <= 0) {
      toast.error('Veuillez remplir le nom et le prix');
      return;
    }

    try {
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
      let createdId: number | null = null;

      if (isLocalhost) {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch('http://localhost:8000/add-product', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              nom: newMatiere.nom,
              quantite: newMatiere.quantite_stock,
              cout_unitaire: newMatiere.prix_achat,
              seuil: newMatiere.seuil_reapprovisionnement,
              categorie: "Ingredient",
              fournisseur: newMatiere.fournisseur,
              unite: newMatiere.unite || detectUnite(newMatiere.nom)
            }),
          });

          if (response.ok) {
            const result = await response.json();
            createdId = result.product?.id;
          }
        } catch (e) {
          console.warn('Local add matiere error:', e);
        }
      }

      // Supabase insert
      const { data: inserted } = await supabase.from('products').insert([{
        nom: newMatiere.nom,
        quantite: newMatiere.quantite_stock,
        cout_unitaire: newMatiere.prix_achat,
        seuil: newMatiere.seuil_reapprovisionnement,
        categorie: "Ingredient",
        type: 'ING',
        fournisseur: newMatiere.fournisseur,
        unite: newMatiere.unite || detectUnite(newMatiere.nom)
      }]).select().single();

      const finalId = createdId || inserted?.id || Date.now();
      const newStockIngredient: StockIngredient = {
        id: finalId,
        nom: newMatiere.nom,
        code: `ING-${finalId}`,
        unite: newMatiere.unite || detectUnite(newMatiere.nom),
        quantite_stock: newMatiere.quantite_stock,
        seuil_reapprovisionnement: newMatiere.seuil_reapprovisionnement,
        prix_achat: newMatiere.prix_achat,
        fournisseur: newMatiere.fournisseur,
        categorie: "Ingredient",
        created_at: new Date().toISOString()
      };

      const updatedMatieres = [...matieresPremieres, newStockIngredient];
      setMatieresPremieres(updatedMatieres);
      saveToLocalStorage(updatedMatieres);

      // Réinitialiser le formulaire
      setNewMatiere({
        nom: '',
        code: '',
        unite: '',
        quantite_stock: 0,
        seuil_reapprovisionnement: 0,
        prix_achat: 0,
        fournisseur: '',
        date_peremption: '',
        categorie: ''
      });
      setShowAddForm(false);
      toast.success('Matière première ajoutée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'ingrédient:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  // Fonction pour supprimer une matière première via l'API
  const deleteMatiere = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette matière première ?')) {
      try {
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
        if (isLocalhost) {
          try {
            const token = localStorage.getItem('access_token');
            await fetch(`http://localhost:8000/delete-product/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (e) {
            console.warn('Local delete matiere error:', e);
          }
        }

        // Supabase delete
        await supabase.from('products').delete().eq('id', id);

        const updatedMatieres = matieresPremieres.filter(m => m.id !== id);
        setMatieresPremieres(updatedMatieres);
        saveToLocalStorage(updatedMatieres);
        toast.success('Matière première supprimée !');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  // Fonction pour mettre à jour le stock
  const updateStock = async (id: number, newStock: number) => {
    try {
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
      if (isLocalhost) {
        try {
          const token = localStorage.getItem('access_token');
          await fetch(`http://localhost:8000/update-product/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantite: newStock })
          });
        } catch (e) {
          console.warn('Local update stock error:', e);
        }
      }

      // Supabase update
      await supabase.from('products').update({ quantite: newStock }).eq('id', id);

      const updatedMatieres = matieresPremieres.map(m =>
        m.id === id ? { ...m, quantite_stock: newStock } : m
      );
      setMatieresPremieres(updatedMatieres);
      saveToLocalStorage(updatedMatieres);
      setEditingState({});
      toast.success('Stock mis à jour !');
    } catch (error) {
      console.error(error);
      toast.error('Erreur connexion');
    }
  };

  // Fonction pour mettre à jour le prix
  const updatePrice = async (id: number, newPrice: number) => {
    try {
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
      if (isLocalhost) {
        try {
          const token = localStorage.getItem('access_token');
          await fetch(`http://localhost:8000/update-product/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cout_unitaire: newPrice })
          });
        } catch (e) {
          console.warn('Local update price error:', e);
        }
      }

      // Supabase update
      await supabase.from('products').update({ cout_unitaire: newPrice }).eq('id', id);

      const updatedMatieres = matieresPremieres.map(m =>
        m.id === id ? { ...m, prix_achat: newPrice } : m
      );
      setMatieresPremieres(updatedMatieres);
      saveToLocalStorage(updatedMatieres);
      setEditingState({});
      toast.success('Prix mis à jour !');
    } catch (error) {
      console.error(error);
      toast.error('Erreur mise à jour');
    }
  };

  // Filtrer les matières premières
  const filteredMatieres = matieresPremieres.filter(matiere => {
    const matchesSearch = matiere.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matiere.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || matiere.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Obtenir les catégories uniques
  const categories = Array.from(new Set(matieresPremieres.map(m => m.categorie).filter(Boolean)));

  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box p={{ base: 2, md: 6 }}>
      {/* Header section with Stats */}
      <Card variant="outline" mb={8} borderRadius="2xl" boxShadow="sm" bg="white" overflow="hidden">
        <Box bgGradient="linear(to-r, #03224c, #0f3460)" p={6} color="white">
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg" display="flex" alignItems="center" gap={3}>
              <Icon as={MdScience} /> Matières Premières
            </Heading>
            <Text opacity={0.8}>Gérez vos ingrédients et surveillez vos niveaux de stock</Text>
          </VStack>
        </Box>
        <CardBody p={6}>
          <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
            <HStack spacing={6}>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="gray.500" fontWeight="bold">Total Ingrédients</Text>
                <Text fontSize="2xl" fontWeight="800" color="blue.900">{matieresPremieres.length}</Text>
              </VStack>
              <Divider orientation="vertical" h="40px" />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="gray.500" fontWeight="bold">En Alerte</Text>
                <Text fontSize="2xl" fontWeight="800" color="red.500">
                  {matieresPremieres.filter(m => m.quantite_stock <= m.seuil_reapprovisionnement).length}
                </Text>
              </VStack>
            </HStack>
            <Button
              leftIcon={<MdAdd />}
              colorScheme="blue"
              onClick={() => setShowAddForm(!showAddForm)}
              px={8}
              borderRadius="xl"
            >
              {showAddForm ? "Fermer" : "Nouvelle Matière"}
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Consumption Analytics Section */}
      <ConsumptionAnalytics />

      {/* Add Form */}
      <Collapse in={showAddForm}>
        <Card variant="outline" mb={8} borderRadius="2xl" border="2px dashed" borderColor="blue.100" bg="blue.50">
          <CardBody>
            <Heading size="md" mb={6} color="blue.900">Nouvelle Matière Première</Heading>
            <Stack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold">Nom</FormLabel>
                  <Input bg="white" placeholder="Nom" value={newMatiere.nom} onChange={e => setNewMatiere({ ...newMatiere, nom: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="bold">Code</FormLabel>
                  <Input bg="white" placeholder="Code" value={newMatiere.code} onChange={e => setNewMatiere({ ...newMatiere, code: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="bold">Unité</FormLabel>
                  <Input bg="white" placeholder="Ex: kg, L, unité..." value={newMatiere.unite} onChange={e => setNewMatiere({ ...newMatiere, unite: e.target.value })} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold">Prix d'achat (TND)</FormLabel>
                  <Input bg="white" type="number" step="0.01" value={newMatiere.prix_achat || ''} onChange={e => setNewMatiere({ ...newMatiere, prix_achat: parseFloat(e.target.value) || 0 })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="bold">Catégorie</FormLabel>
                  <Input bg="white" placeholder="Catégorie" value={newMatiere.categorie} onChange={e => setNewMatiere({ ...newMatiere, categorie: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="bold">Fournisseur</FormLabel>
                  <Input bg="white" placeholder="Fournisseur" value={newMatiere.fournisseur} onChange={e => setNewMatiere({ ...newMatiere, fournisseur: e.target.value })} />
                </FormControl>
              </SimpleGrid>
              <HStack justify="flex-end" pt={4}>
                <Button variant="ghost" mr={3} onClick={() => setShowAddForm(false)}>Annuler</Button>
                <Button colorScheme="green" px={10} leftIcon={<MdCheck />} onClick={addMatiere}>Enregistrer</Button>
              </HStack>
            </Stack>
          </CardBody>
        </Card>
      </Collapse>

      {/* Filters */}
      <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={8}>
        <InputGroup flex={2}>
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            bg="white"
            borderRadius="xl"
            boxShadow="sm"
            placeholder="Rechercher par nom ou code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Select
          flex={1}
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          placeholder="Toutes les catégories"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </Select>
      </Stack >

      {/* List section */}
      {
        filteredMatieres.length === 0 ? (
          <Card variant="outline" p={10} textAlign="center" borderRadius="2xl" border="2px dashed" borderColor="gray.200">
            <VStack spacing={4}>
              <Icon as={MdScience} boxSize={12} color="gray.300" />
              <Box>
                <Heading size="md" color="gray.600">Aucun ingrédient trouvé</Heading>
                <Text color="gray.400">Essayez d'ajuster vos filtres ou ajoutez une nouvelle matière.</Text>
              </Box>
              <Button colorScheme="blue" variant="outline" onClick={() => setShowAddForm(true)}>Ajouter</Button>
            </VStack>
          </Card>
        ) : (
          <Card borderRadius="2xl" boxShadow="md" overflow="hidden" border="none">
            {isMobile ? (
              <SimpleGrid columns={2} spacing={2} p={2}>
                {
                  filteredMatieres.map(matiere => {
                    const isLowStock = matiere.quantite_stock <= matiere.seuil_reapprovisionnement;
                    return (
                      <Box key={matiere.id} p={3} bg={isLowStock ? "red.50" : "white"} borderRadius="lg" border="1px solid" borderColor="gray.100" shadow="sm">
                        <VStack align="stretch" spacing={2}>
                          <Flex justify="space-between" align="start">
                            <VStack align="start" spacing={0} maxW="70%">
                              <Text fontWeight="bold" fontSize="xs" color="blue.900" isTruncated w="full">{matiere.nom}</Text>
                              <Text fontSize="9px" color="gray.500">{matiere.code}</Text>
                            </VStack>
                            <Badge colorScheme={matiere.categorie === 'Ingredient' ? 'blue' : 'orange'} borderRadius="full" px={1} fontSize="8px">
                              {(matiere.categorie || 'Ing').substring(0, 3)}
                            </Badge>
                          </Flex>

                          <Divider opacity={0.3} />

                          <VStack align="stretch" spacing={1}>
                            <Box>
                              <Text fontSize="8px" color="gray.500" textTransform="uppercase">Stock</Text>
                              {editingState[matiere.id]?.field === 'quantite_stock' ? (
                                <Input
                                  size="xs"
                                  type="number"
                                  defaultValue={matiere.quantite_stock}
                                  onBlur={(e) => updateStock(matiere.id, parseFloat(e.target.value) || 0)}
                                  autoFocus
                                />
                              ) : (
                                <HStack onClick={() => setEditingState({ [matiere.id]: { field: 'quantite_stock', value: matiere.quantite_stock } })}>
                                  <Text fontWeight="bold" fontSize="xs" color={isLowStock ? "red.600" : "green.600"}>
                                    {formatQuantity(matiere.quantite_stock)} {matiere.unite}
                                  </Text>
                                </HStack>
                              )}
                            </Box>

                            <Box>
                              <Text fontSize="8px" color="gray.500" textTransform="uppercase">Prix</Text>
                              {editingState[matiere.id]?.field === 'prix_achat' ? (
                                <Input
                                  size="xs"
                                  type="number"
                                  step="0.01"
                                  defaultValue={matiere.prix_achat}
                                  onBlur={(e) => updatePrice(matiere.id, parseFloat(e.target.value) || 0)}
                                  autoFocus
                                />
                              ) : (
                                <HStack onClick={() => setEditingState({ [matiere.id]: { field: 'prix_achat', value: matiere.prix_achat } })}>
                                  <Text fontWeight="bold" fontSize="xs">{matiere.prix_achat.toFixed(2)} DT</Text>
                                </HStack>
                              )}
                            </Box>
                          </VStack>

                          <Flex justify="flex-end" pt={1}>
                            <IconButton
                              aria-label="Delete"
                              icon={<MdDelete />}
                              colorScheme="red"
                              variant="ghost"
                              size="xs"
                              h="20px"
                              minW="20px"
                              onClick={() => deleteMatiere(matiere.id)}
                            />
                          </Flex>
                        </VStack>
                      </Box>
                    );
                  })
                }
              </SimpleGrid>
            ) : (
              <TableContainer>
                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Matière</Th>
                      <Th>Code</Th>
                      <Th textAlign="center">Stock Actuel</Th>
                      <Th textAlign="right">Prix Unitaire</Th>
                      <Th>Catégorie</Th>
                      <Th textAlign="center">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredMatieres.map(matiere => {
                      const isLowStock = matiere.quantite_stock <= (matiere.seuil_reapprovisionnement || 0);
                      return (
                        <Tr key={matiere.id} _hover={{ bg: "gray.50" }} bg={isLowStock ? "red.50" : "transparent"}>
                          <Td>
                            <Text fontWeight="bold" color="blue.900">{matiere.nom}</Text>
                          </Td>
                          <Td>
                            <Badge variant="outline" colorScheme="gray">{matiere.code}</Badge>
                          </Td>
                          <Td textAlign="center">
                            {editingState[matiere.id]?.field === 'quantite_stock' ? (
                              <Input
                                size="xs"
                                w="80px"
                                type="number"
                                defaultValue={matiere.quantite_stock}
                                onBlur={(e) => updateStock(matiere.id, parseFloat(e.target.value) || 0)}
                                onKeyDown={(e) => { if (e.key === 'Enter') updateStock(matiere.id, parseFloat(e.currentTarget.value) || 0) }}
                                autoFocus
                              />
                            ) : (
                              <HStack justify="center" spacing={2} onClick={() => setEditingState({ [matiere.id]: { field: 'quantite_stock', value: matiere.quantite_stock } })} cursor="pointer">
                                <Text fontWeight="700" color={isLowStock ? "red.600" : "green.700"}>
                                  {formatQuantity(matiere.quantite_stock)} {matiere.unite}
                                </Text>
                                <Icon as={MdEdit} boxSize={3} color="gray.300" opacity={0} _groupHover={{ opacity: 1 }} />
                              </HStack>
                            )}
                          </Td>
                          <Td textAlign="right">
                            {editingState[matiere.id]?.field === 'prix_achat' ? (
                              <Input
                                size="xs"
                                w="80px"
                                type="number"
                                step="0.01"
                                defaultValue={matiere.prix_achat}
                                onBlur={(e) => updatePrice(matiere.id, parseFloat(e.target.value) || 0)}
                                onKeyDown={(e) => { if (e.key === 'Enter') updatePrice(matiere.id, parseFloat(e.currentTarget.value) || 0) }}
                                autoFocus
                              />
                            ) : (
                              <HStack justify="flex-end" spacing={2} onClick={() => setEditingState({ [matiere.id]: { field: 'prix_achat', value: matiere.prix_achat } })} cursor="pointer">
                                <Text fontWeight="600">{matiere.prix_achat.toFixed(3)} TND</Text>
                                <Icon as={MdEdit} boxSize={3} color="gray.300" />
                              </HStack>
                            )}
                          </Td>
                          <Td>
                            <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3}>
                              {matiere.categorie || 'Ingrédient'}
                            </Badge>
                          </Td>
                          <Td textAlign="center">
                            <IconButton
                              aria-label="Delete"
                              icon={<MdDelete />}
                              colorScheme="red"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMatiere(matiere.id)}
                            />
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )
      }
    </Box >
  );
}