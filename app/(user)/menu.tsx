import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Colors } from '../../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  isVeg: boolean;
  image?: string;
}

const CATEGORIES = ['Main Course', 'Beverages', 'Appetizers', 'Desserts'];

export default function MenuScreen() {
  const [items, setItems] = useState<MenuItem[]>([
    { id: '1', name: 'Chicken Rice', price: '600', category: 'Main Course', isVeg: false },
    { id: '2', name: 'Coke', price: '200', category: 'Beverages', isVeg: true },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formIsVeg, setFormIsVeg] = useState(true);

  const [errors, setErrors] = useState<{name?: string, price?: string}>({});

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormPrice('');
    setFormCategory(CATEGORIES[0]);
    setFormIsVeg(true);
    setErrors({});
    setModalVisible(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormPrice(item.price);
    setFormCategory(item.category);
    setFormIsVeg(item.isVeg);
    setErrors({});
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this specific item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setItems(items.filter(i => i.id !== id)) }
    ]);
  };

  const handleSave = () => {
    // Validation
    const newErrors: {name?: string, price?: string} = {};
    if (!formName.trim()) newErrors.name = "Food Name is required";
    if (!formPrice.trim()) newErrors.price = "Price is required";
    else if (isNaN(Number(formPrice))) newErrors.price = "Price must be a valid number";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingId) {
      setItems(items.map(item => item.id === editingId ? { ...item, name: formName, price: formPrice, category: formCategory, isVeg: formIsVeg } : item));
    } else {
      const newItem: MenuItem = {
        id: Math.random().toString(),
        name: formName,
        price: formPrice,
        category: formCategory,
        isVeg: formIsVeg,
      };
      setItems([...items, newItem]);
    }
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemTitleRow}>
          <MaterialCommunityIcons 
            name={item.isVeg ? "leaf" : "food-drumstick"} 
            size={20} 
            color={item.isVeg ? "#4CAF50" : "#F44336"} 
          />
          <Text style={styles.itemName}>{item.name}</Text>
        </View>
        <Text style={styles.itemPrice}>Rs. {item.price}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
          <Ionicons name="pencil" size={16} color={Colors.default.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash" size={16} color="#F44336" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#FEEDE6", "#FFFFFF"]} style={styles.gradient}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Menu Management</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add New Item</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Add/Edit Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Item' : 'Add New Item'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Food Name */}
                <Text style={styles.label}>Food Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="e.g. Chicken Rice"
                  value={formName}
                  onChangeText={setFormName}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                {/* Price */}
                <Text style={styles.label}>Price (Rs.)</Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  placeholder="e.g. 600"
                  keyboardType="numeric"
                  value={formPrice}
                  onChangeText={setFormPrice}
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

                {/* Category Dropdown (Simplified as horizontal scroll for ease) */}
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      style={[styles.categoryChip, formCategory === cat && styles.categoryChipActive]}
                      onPress={() => setFormCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, formCategory === cat && styles.categoryChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Upload Image Button Placeholder */}
                <Text style={styles.label}>Item Image</Text>
                <TouchableOpacity style={styles.uploadBtn}>
                  <Ionicons name="image-outline" size={24} color="#888" />
                  <Text style={styles.uploadBtnText}>Upload Image</Text>
                </TouchableOpacity>

                {/* Veg / Non-Veg Toggle */}
                <Text style={styles.label}>Dietary Preference</Text>
                <View style={styles.vegToggleContainer}>
                  <TouchableOpacity 
                    style={[styles.vegBtn, formIsVeg && styles.vegBtnActiveLine]}
                    onPress={() => setFormIsVeg(true)}
                  >
                    <MaterialCommunityIcons name="leaf" size={20} color={formIsVeg ? "#4CAF50" : "#888"} />
                    <Text style={[styles.vegBtnText, formIsVeg && {color: "#4CAF50"}]}>Veg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.vegBtn, !formIsVeg && styles.nonVegBtnActiveLine]}
                    onPress={() => setFormIsVeg(false)}
                  >
                    <MaterialCommunityIcons name="food-drumstick" size={20} color={!formIsVeg ? "#F44336" : "#888"} />
                    <Text style={[styles.vegBtnText, !formIsVeg && {color: "#F44336"}]}>Non-Veg</Text>
                  </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save Item</Text>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  addBtn: { flexDirection: 'row', backgroundColor: Colors.default.primary, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 25, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  listContent: { paddingBottom: 100 },
  
  itemCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  itemHeader: { marginBottom: 15 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  itemPrice: { fontSize: 16, color: '#666', marginTop: 5 },
  
  itemActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  editBtnText: { color: Colors.default.primary, fontWeight: 'bold', marginLeft: 5 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center' },
  deleteBtnText: { color: '#F44336', fontWeight: 'bold', marginLeft: 5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16 },
  inputError: { borderColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 12, marginTop: 5 },

  categoryScroll: { flexDirection: 'row', marginBottom: 10 },
  categoryChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10 },
  categoryChipActive: { backgroundColor: Colors.default.primary },
  categoryChipText: { color: '#666', fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },

  uploadBtn: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 20, alignItems: 'center', backgroundColor: '#fafafa' },
  uploadBtnText: { color: '#888', marginTop: 10 },

  vegToggleContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  vegBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginHorizontal: 5 },
  vegBtnActiveLine: { borderColor: '#4CAF50', backgroundColor: '#e8f5e9' },
  nonVegBtnActiveLine: { borderColor: '#F44336', backgroundColor: '#ffebee' },
  vegBtnText: { fontWeight: 'bold', marginLeft: 8, color: '#888' },

  saveBtn: { backgroundColor: Colors.default.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 10, marginTop: 30, marginBottom: 20 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
});
