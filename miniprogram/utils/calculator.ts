/**
 * 成本计算工具函数
 */

/**
 * 物料接口定义
 */
export interface Material {
  _id: string;
  dk_id: number;
  name: string;
  category: 'material' | 'packaging';
  spec_amount: number;
  spec_unit: 'g' | 'ml' | 'piece';
  spec_price: number;
}

/**
 * 产品配方项接口
 */
export interface RecipeItem {
  material_dk_id: number;
  amount: number;
}

/**
 * 产品接口定义
 */
export interface Product {
  _id: string;
  name: string;
  recipe: RecipeItem[];
  price_normal?: number;  // 常规价格
  price_special?: number;  // 特殊价格
}

/**
 * 成本明细项
 */
export interface CostDetail {
  materialName: string;
  amount: number;
  unit: string;
  unitPrice: number;
  itemCost: number;
  category: 'material' | 'packaging'; // 物料分类
}

/**
 * 产品成本信息
 */
export interface CostInfo {
  totalCost: number;
  details: CostDetail[];
}

/**
 * 物料Map类型（使用dk_id作为key）
 */
export type MaterialsMap = { [key: number]: Material };

/**
 * 计算物料单位成本
 */
export function calculateUnitPrice(material: Material): number {
  return parseFloat((material.spec_price / material.spec_amount).toFixed(4));
}

/**
 * 计算产品总成本
 */
export function calculateProductCost(
  product: Product,
  materialsMap: MaterialsMap
): CostInfo {
  let totalCost = 0;
  const details: CostDetail[] = [];

  // 检查 product 和 recipe
  if (!product || !product.recipe || !Array.isArray(product.recipe)) {
    return {
      totalCost: 0,
      details: []
    };
  }

  product.recipe.forEach((recipeItem, index) => {
    // 查找物料（通过dk_id，都是number类型）
    const dkId = recipeItem.material_dk_id;
    
    // 确保 dkId 是有效的 number
    if (dkId === undefined || dkId === null || isNaN(Number(dkId))) {
      console.warn(`无效的 material_dk_id: ${dkId}`, {
        recipeIndex: index,
        recipeItem
      });
      return;
    }
    
    const material = materialsMap[dkId];
    
    if (!material) {
      console.warn(`物料未找到: material_dk_id = ${dkId}`, {
        recipeIndex: index,
        recipeItem,
        availableKeys: Object.keys(materialsMap).slice(0, 10).map(k => ({
          key: k,
          keyNumber: Number(k),
          material: materialsMap[Number(k)]?.name
        }))
      });
      return;
    }

    // 计算单位成本
    const unitPrice = calculateUnitPrice(material);

    // 计算该项成本
    const itemCost = recipeItem.amount * unitPrice;

    // 累加（不管category是什么，都要计算）
    totalCost += itemCost;

    // 记录明细（包含category信息，原料和包装都要记录）
    details.push({
      materialName: material.name,
      amount: recipeItem.amount,
      unit: material.spec_unit,
      unitPrice: unitPrice,
      itemCost: parseFloat(itemCost.toFixed(2)),
      category: material.category
    });
  });

  return {
    totalCost: parseFloat(totalCost.toFixed(2)),
    details: details
  };
}

/**
 * 将物料数组转换为 Map，提高查找效率
 */
export function buildMaterialsMap(materials: Material[]): MaterialsMap {
  const map: MaterialsMap = {};
  materials.forEach(material => {
    // 检查material是否存在且有dk_id
    if (material && material.dk_id !== undefined && material.dk_id !== null) {
      // 直接使用dk_id作为key（dk_id是number类型）
      map[material.dk_id] = material;
    } else {
      console.warn('无效的物料数据:', material);
    }
  });
  return map;
}

