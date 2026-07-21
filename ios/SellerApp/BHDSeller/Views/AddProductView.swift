//
//  AddProductView.swift
//  BHD Seller Dashboard
//
//  Add/edit product form with image upload, variants, and attributes
//

import SwiftUI
import PhotosUI

struct AddProductView: View {
    @Environment(\.dismiss) private var dismiss
    var product: SellerProduct? = nil
    var isEditing: Bool = false
    
    // Form Fields
    @State private var name = ""
    @State private var nameAr = ""
    @State private var description = ""
    @State private var descriptionAr = ""
    @State private var price = ""
    @State private var compareAtPrice = ""
    @State private var sku = ""
    @State private var stock = ""
    @State private var weight = ""
    @State private var selectedCategory = "Electronics"
    @State private var isActive = true
    @State private var isFeatured = false
    @State private var tags = ""
    @State private var selectedImages: [UIImage] = []
    @State private var showImagePicker = false
    @State private var showCamera = false
    
    // Variants
    @State private var variants: [ProductVariant] = []
    @State private var showAddVariant = false
    
    // Attributes
    @State private var attributes: [ProductAttributeForm] = []
    
    // Validation
    @State private var showValidationError = false
    @State private var validationMessage = ""
    @State private var isSaving = false
    
    let categories = ["Electronics", "Fashion", "Home", "Sports", "Beauty", "Books", "Toys", "Automotive"]
    
    var isFormValid: Bool {
        !name.isEmpty && !price.isEmpty && !sku.isEmpty && !stock.isEmpty && Double(price) != nil && Int(stock) != nil
    }
    
    var body: some View {
        NavigationStack {
            Form {
                // Images Section
                imagesSection
                
                // Basic Info
                basicInfoSection
                
                // Pricing
                pricingSection
                
                // Inventory
                inventorySection
                
                // Description
                descriptionSection
                
                // Variants
                variantsSection
                
                // Attributes
                attributesSection
                
                // Settings
                settingsSection
            }
            .navigationTitle(isEditing ? "Edit Product" : "Add Product")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(isSaving ? "Saving..." : (isEditing ? "Update" : "Save")) {
                        saveProduct()
                    }
                    .disabled(!isFormValid || isSaving)
                    .fontWeight(.semibold)
                }
            }
            .sheet(isPresented: $showImagePicker) {
                ImagePicker(selectedImages: $selectedImages)
            }
            .alert("Validation Error", isPresented: $showValidationError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(validationMessage)
            }
            .onAppear {
                if let product = product {
                    loadProductData(product)
                }
            }
        }
    }
    
    // MARK: - Images Section
    private var imagesSection: some View {
        Section("Product Images") {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    // Add Image Button
                    Button(action: { showImagePicker = true }) {
                        VStack(spacing: 8) {
                            Image(systemName: "camera.fill")
                                .font(.title2)
                                .foregroundColor(.bhdSellerPrimary)
                            Text("Add Photo")
                                .font(.caption)
                                .foregroundColor(.bhdSellerPrimary)
                        }
                        .frame(width: 100, height: 100)
                        .background(Color.bhdSellerPrimary.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    
                    // Selected Images
                    ForEach(Array(selectedImages.enumerated()), id: \.offset) { index, image in
                        ZStack(alignment: .topTrailing) {
                            Image(uiImage: image)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: 100, height: 100)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            
                            Button(action: {
                                selectedImages.remove(at: index)
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.white)
                                    .background(Circle().fill(Color.black.opacity(0.5)))
                            }
                            .offset(x: 4, y: -4)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }
    
    // MARK: - Basic Info Section
    private var basicInfoSection: some View {
        Section("Basic Information") {
            TextField("Product Name (English)", text: $name)
            TextField("Product Name (Arabic)", text: $nameAr)
            TextField("SKU", text: $sku)
                .textInputAutocapitalization(.characters)
            
            Picker("Category", selection: $selectedCategory) {
                ForEach(categories, id: \.self) { category in
                    Text(category).tag(category)
                }
            }
            
            TextField("Tags (comma separated)", text: $tags)
        }
    }
    
    // MARK: - Pricing Section
    private var pricingSection: some View {
        Section("Pricing") {
            HStack {
                Text("BHD")
                    .foregroundColor(.secondary)
                TextField("Price", text: $price)
                    .keyboardType(.decimalPad)
            }
            
            HStack {
                Text("BHD")
                    .foregroundColor(.secondary)
                TextField("Compare at Price (optional)", text: $compareAtPrice)
                    .keyboardType(.decimalPad)
            }
        }
    }
    
    // MARK: - Inventory Section
    private var inventorySection: some View {
        Section("Inventory") {
            TextField("Stock Quantity", text: $stock)
                .keyboardType(.numberPad)
            
            HStack {
                Text("kg")
                    .foregroundColor(.secondary)
                TextField("Weight (optional)", text: $weight)
                    .keyboardType(.decimalPad)
            }
        }
    }
    
    // MARK: - Description Section
    private var descriptionSection: some View {
        Section("Description") {
            TextEditor(text: $description)
                .frame(minHeight: 80)
                .overlay(
                    Group {
                        if description.isEmpty {
                            Text("Description (English)")
                                .foregroundColor(.secondary)
                                .padding(.top, 8)
                                .padding(.leading, 4)
                        }
                    },
                    alignment: .topLeading
                )
            
            TextEditor(text: $descriptionAr)
                .frame(minHeight: 80)
                .overlay(
                    Group {
                        if descriptionAr.isEmpty {
                            Text("Description (Arabic)")
                                .foregroundColor(.secondary)
                                .padding(.top, 8)
                                .padding(.leading, 4)
                        }
                    },
                    alignment: .topLeading
                )
        }
    }
    
    // MARK: - Variants Section
    private var variantsSection: some View {
        Section {
            HStack {
                Text("Product Variants")
                    .font(.headline)
                Spacer()
                Button(action: { showAddVariant = true }) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(.bhdSellerPrimary)
                }
            }
            
            if variants.isEmpty {
                Text("No variants added")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                ForEach(variants) { variant in
                    VariantRow(variant: variant) {
                        if let index = variants.firstIndex(where: { $0.id == variant.id }) {
                            variants.remove(at: index)
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showAddVariant) {
            AddVariantSheet { variant in
                variants.append(variant)
            }
        }
    }
    
    // MARK: - Attributes Section
    private var attributesSection: some View {
        Section("Product Attributes") {
            if attributes.isEmpty {
                Button(action: { addEmptyAttribute() }) {
                    HStack {
                        Image(systemName: "plus")
                        Text("Add Attribute")
                    }
                    .foregroundColor(.bhdSellerPrimary)
                }
            } else {
                ForEach($attributes) { $attr in
                    HStack(spacing: 8) {
                        TextField("Name", text: $attr.name)
                            .frame(maxWidth: .infinity)
                        Divider()
                        TextField("Value", text: $attr.value)
                            .frame(maxWidth: .infinity)
                    }
                }
                .onDelete { indexSet in
                    attributes.remove(atOffsets: indexSet)
                }
                
                Button(action: addEmptyAttribute) {
                    HStack {
                        Image(systemName: "plus")
                        Text("Add Attribute")
                    }
                    .foregroundColor(.bhdSellerPrimary)
                }
            }
        }
    }
    
    // MARK: - Settings Section
    private var settingsSection: some View {
        Section("Settings") {
            Toggle("Active", isOn: $isActive)
            Toggle("Featured", isOn: $isFeatured)
        }
    }
    
    // MARK: - Load Product Data
    private func loadProductData(_ product: SellerProduct) {
        name = product.name
        sku = product.sku
        price = String(format: "%.3f", product.price)
        stock = "\(product.stock)"
        selectedCategory = product.category
        isActive = product.isActive
    }
    
    // MARK: - Add Empty Attribute
    private func addEmptyAttribute() {
        attributes.append(ProductAttributeForm(name: "", value: ""))
    }
    
    // MARK: - Save Product
    private func saveProduct() {
        guard validateForm() else { return }
        
        isSaving = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isSaving = false
            dismiss()
        }
    }
    
    // MARK: - Validate Form
    private func validateForm() -> Bool {
        if name.isEmpty {
            validationMessage = "Product name is required"
            showValidationError = true
            return false
        }
        if Double(price) == nil {
            validationMessage = "Please enter a valid price"
            showValidationError = true
            return false
        }
        if Int(stock) == nil {
            validationMessage = "Please enter a valid stock quantity"
            showValidationError = true
            return false
        }
        return true
    }
}

// MARK: - Variant Row
struct VariantRow: View {
    let variant: ProductVariant
    let onDelete: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(variant.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                HStack(spacing: 12) {
                    Text("BHD \(String(format: "%.3f", variant.price))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(variant.stock) in stock")
                        .font(.caption)
                        .foregroundColor(variant.stock <= 5 ? .red : .secondary)
                }
            }
            
            Spacer()
            
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .foregroundColor(.red.opacity(0.7))
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Add Variant Sheet
struct AddVariantSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onAdd: (ProductVariant) -> Void
    
    @State private var name = ""
    @State private var price = ""
    @State private var stock = ""
    @State private var sku = ""
    
    var body: some View {
        NavigationStack {
            Form {
                TextField("Variant Name (e.g. Size: Large, Color: Red)", text: $name)
                TextField("Price", text: $price)
                    .keyboardType(.decimalPad)
                TextField("Stock", text: $stock)
                    .keyboardType(.numberPad)
                TextField("SKU (optional)", text: $sku)
            }
            .navigationTitle("Add Variant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        if let priceVal = Double(price), let stockVal = Int(stock), !name.isEmpty {
                            onAdd(ProductVariant(name: name, price: priceVal, stock: stockVal, sku: sku.isEmpty ? nil : sku))
                            dismiss()
                        }
                    }
                    .disabled(name.isEmpty || price.isEmpty || stock.isEmpty)
                }
            }
        }
    }
}

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImages: [UIImage]
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.selectionLimit = 5
        config.filter = .images
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            parent.dismiss()
            
            for result in results {
                if result.itemProvider.canLoadObject(ofClass: UIImage.self) {
                    result.itemProvider.loadObject(ofClass: UIImage.self) { image, _ in
                        if let image = image as? UIImage {
                            DispatchQueue.main.async {
                                self.parent.selectedImages.append(image)
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Form Models
struct ProductVariant: Identifiable {
    let id = UUID()
    let name: String
    let price: Double
    let stock: Int
    let sku: String?
}

struct ProductAttributeForm: Identifiable {
    let id = UUID()
    var name: String
    var value: String
}

#Preview {
    AddProductView()
}
