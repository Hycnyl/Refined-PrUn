export function isFactionContract(contract: PrunApi.Contract) {
  return !!contract.partner.countryCode;
}

export function canAcceptContract(contract: PrunApi.Contract) {
  return contract.party === 'CUSTOMER' && contract.status === 'OPEN';
}

export function canPartnerAcceptContract(contract: PrunApi.Contract) {
  return contract.party === 'PROVIDER' && contract.status === 'OPEN';
}

export function isSelfCondition(contract: PrunApi.Contract, condition: PrunApi.ContractCondition) {
  return contract.party === condition.party;
}

export function isPartnerCondition(
  contract: PrunApi.Contract,
  condition: PrunApi.ContractCondition,
) {
  return contract.party !== condition.party;
}

export function friendlyConditionText(type: PrunApi.ContractConditionType) {
  switch (type) {
    case 'BASE_CONSTRUCTION':
      return '建造基地';
    case 'BUILDING_CONSTRUCTION':
      return '建造建筑';
    case 'BUY_MATERIAL_FROM_CATEGORY':
      return '购买';
    case 'COMEX_PURCHASE_PICKUP':
      return '提取材料';
    case 'CONSTRUCT_SHIP':
      return '飞船项目';
    case 'CONTRIBUTION':
      return '捐赠';
    case 'DELIVERY':
      return '交付';
    case 'DELIVERY_SHIPMENT':
      return 'Delivery';
    case 'EXPLORATION':
      return '探索';
    case 'FINISH_FLIGHT':
      return '完成航行';
    case 'FULFILL_COUNTRY_CONTRACT':
      return '完成合同';
    case 'GATEWAY_FUEL':
      return '星门燃料';
    case 'HEADQUARTERS_UPGRADE':
      return '总部升级';
    case 'INCREASE_SATISFACTION':
      return '劳动力满意度';
    case 'INFRASTRUCTURE_CONSTRUCTION_FINISH':
      return '完成基建建造';
    case 'INFRASTRUCTURE_CONSTRUCTION_START':
      return '开始基建建造';
    case 'INFRASTRUCTURE_UPGRADE_FINISH':
      return '完成基建升级';
    case 'INFRASTRUCTURE_UPGRADE_START':
      return '开始基建升级';
    case 'INFRASTRUCTURE_UPKEEP':
      return '基础设施维护';
    case 'LOAN_INSTALLMENT':
      return '贷款分期';
    case 'LOAN_PAYOUT':
      return '发放贷款';
    case 'MAKE_MONEY':
      return '赚取资金';
    case 'PAYMENT':
      return '支付';
    case 'PICKUP':
      return '提取';
    case 'PICKUP_SHIPMENT':
      return 'Pickup';
    case 'PLACE_ORDER':
      return '下单';
    case 'POWER':
      return '成为总督';
    case 'PRODUCTION_ORDER_COMPLETED':
      return '完成生产订单';
    case 'PRODUCTION_RUN':
      return '开展生产';
    case 'PROVISION':
      return '供应';
    case 'PROVISION_SHIPMENT':
      return 'Provision';
    case 'REPAIR_SHIP':
      return '维修飞船';
    case 'REPUTATION':
      return '声望';
    case 'START_FLIGHT':
      return '开始航行';
    case 'WAIT':
      return '等待';
    case 'WORKFORCE_PROGRAM_PAYMENT':
      return '劳动力工资';
    case 'WORKFORCE_PROGRAM_START':
      return '劳动力计划';
    default:
      return type;
  }
}
