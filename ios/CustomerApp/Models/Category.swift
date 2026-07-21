//
//  Category.swift
//  BHD Marketplace
//
//  Category model with hierarchy support
//

import Foundation

// MARK: - Category
struct Category: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let nameAr: String
    let slug: String
    let description: String?
    let descriptionAr: String?
    let icon: String
    let image: String?
    let parent: String?
    let order: Int
    let isActive: Bool
    let productCount: Int
    let subcategories: [Category]?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, nameAr, slug, description, descriptionAr
        case icon, image, parent, order, isActive
        case productCount, subcategories, createdAt, updatedAt
    }
    
    var localizedName: String {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? nameAr : name
    }
    
    var localizedDescription: String? {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? descriptionAr : description
    }
}

// MARK: - Category Response
struct CategoriesResponse: Codable {
    let categories: [Category]
    let total: Int
}

// MARK: - Banner
struct Banner: Identifiable, Codable {
    let id: String
    let title: String
    let titleAr: String?
    let subtitle: String?
    let subtitleAr: String?
    let image: String
    let link: String?
    let linkType: LinkType
    let backgroundColor: String?
    let textColor: String?
    let order: Int
    let isActive: Bool
    let startDate: Date?
    let endDate: Date?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case title, titleAr, subtitle, subtitleAr, image
        case link, linkType, backgroundColor, textColor
        case order, isActive, startDate, endDate
    }
    
    var localizedTitle: String {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? (titleAr ?? title) : title
    }
    
    var localizedSubtitle: String? {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? (subtitleAr ?? subtitle) : subtitle
    }
    
    enum LinkType: String, Codable {
        case product
        case category
        case url
        case none
    }
}

// MARK: - HomeSection
struct HomeSection: Identifiable, Codable {
    let id: String
    let type: SectionType
    let title: String
    let titleAr: String?
    let subtitle: String?
    let subtitleAr: String?
    let items: [Product]
    let categoryId: String?
    let banner: Banner?
    let order: Int
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case type, title, titleAr, subtitle, subtitleAr
        case items, categoryId, banner, order
    }
    
    var localizedTitle: String {
        let isRTL = LocalizationManager.shared.currentLanguage == "ar"
        return isRTL ? (titleAr ?? title) : title
    }
    
    enum SectionType: String, Codable {
        case featured
        case trending
        case newArrivals
        category
        case banner
        case bestSellers
        case flashSale
    }
}
