<script setup lang="ts">
import { fixed02 } from '@src/utils/format';
import AddressLink from '@src/features/XIT/CONTC/AddressLink.vue';
import PrunLink from '@src/components/PrunLink.vue';

defineProps<{ condition: PrunApi.ContractCondition }>();
</script>

<template>
  <template v-if="condition.type === 'BASE_CONSTRUCTION'">建立基地</template>
  <template v-if="condition.type === 'BUILDING_CONSTRUCTION'">建造建筑</template>
  <template v-if="condition.type === 'BUY_MATERIAL_FROM_CATEGORY'">购买材料</template>
  <template v-else-if="condition.type === 'COMEX_PURCHASE_PICKUP'"
    >提取 {{ condition.quantity!.amount - condition.pickedUp!.amount }}
    {{ condition.quantity!.material.ticker }} @
    <AddressLink :address="condition.address!" />
  </template>
  <template v-else-if="condition.type === 'CONSTRUCT_SHIP'">建造或改装飞船</template>
  <template v-else-if="condition.type === 'CONTRIBUTION'"
    >捐赠于 <AddressLink :address="condition.address!" />
  </template>
  <template v-else-if="condition.type === 'DELIVERY'"
    >交付 {{ condition.quantity!.amount }} {{ condition.quantity!.material.ticker }} @
    <AddressLink :address="condition.address!" />
  </template>
  <template v-else-if="condition.type === 'DELIVERY_SHIPMENT'"
    >交付货运于 <AddressLink :address="condition.destination!" />
  </template>
  <template v-else-if="condition.type === 'EXPLORATION'"
    >探索 <AddressLink :address="condition.address!" />
  </template>
  <template v-else-if="condition.type === 'FINISH_FLIGHT'">完成航行</template>
  <template v-else-if="condition.type === 'FULFILL_COUNTRY_CONTRACT'">完成阵营合同 </template>
  <template v-else-if="condition.type === 'GATEWAY_FUEL'"
    >加油
    <PrunLink inline :command="`GTW ${condition.gatewayId?.naturalId}`">{{
      condition.gatewayId?.name
    }}</PrunLink>
  </template>
  <template v-else-if="condition.type === 'HEADQUARTERS_UPGRADE'">升级总部</template>
  <template v-else-if="condition.type === 'INCREASE_SATISFACTION'">提高满意度</template>
  <template v-else-if="condition.type === 'INFRASTRUCTURE_CONSTRUCTION_FINISH'"
    >完成基础设施建造
  </template>
  <template v-else-if="condition.type === 'INFRASTRUCTURE_CONSTRUCTION_START'"
    >开始基础设施建造
  </template>
  <template v-else-if="condition.type === 'INFRASTRUCTURE_UPGRADE_FINISH'"
    >完成基础设施升级
  </template>
  <template v-else-if="condition.type === 'INFRASTRUCTURE_UPGRADE_START'"
    >开始基础设施升级
  </template>
  <template v-else-if="condition.type === 'INFRASTRUCTURE_UPKEEP'"
    >维护
    <PrunLink inline :command="`INFU ${condition.infrastructureId?.naturalId}`">{{
      condition.infrastructureId?.name
    }}</PrunLink>
  </template>
  <template v-else-if="condition.type === 'LOAN_INSTALLMENT'"
    >支付 {{ fixed02(condition.repayment!.amount + condition.interest!.amount) }}
    {{ condition.repayment!.currency }}（自动）</template
  >
  <template v-else-if="condition.type === 'LOAN_PAYOUT'"
    >支付 {{ fixed02(condition.amount!.amount) }} {{ condition.amount!.currency }}
  </template>
  <template v-else-if="condition.type === 'MAKE_MONEY'">赚取资金</template>
  <template v-else-if="condition.type === 'PAYMENT'"
    >支付 {{ fixed02(condition.amount!.amount) }} {{ condition.amount!.currency }}
  </template>
  <template v-else-if="condition.type === 'PICKUP'">提取</template>
  <template v-else-if="condition.type === 'PICKUP_SHIPMENT'"
    >提取货运于 <AddressLink :address="condition.address!" />
  </template>
  <template v-else-if="condition.type === 'PLACE_ORDER'">下单</template>
  <template v-else-if="condition.type === 'POWER'">成为总督</template>
  <template v-else-if="condition.type === 'PRODUCTION_ORDER_COMPLETED'">完成生产订单 </template>
  <template v-else-if="condition.type === 'PRODUCTION_RUN'">开展生产</template>
  <template v-else-if="condition.type === 'PROVISION'"
    >供应 {{ condition.quantity!.amount }} {{ condition.quantity!.material.ticker }} @
    <AddressLink :address="condition.address!" />
  </template>
  <template v-else-if="condition.type === 'PROVISION_SHIPMENT'"
    >供应 {{ condition.quantity!.amount }} {{ condition.quantity!.material.ticker }} @
    <AddressLink :address="condition.address!" />
  </template>
  <template v-else-if="condition.type === 'REPAIR_SHIP'">维修飞船</template>
  <template v-else-if="condition.type === 'START_FLIGHT'">开始航行</template>
  <template v-else-if="condition.type === 'WAIT'">等待</template>
  <template v-else-if="condition.type === 'WORKFORCE_PROGRAM_PAYMENT'"
    >支付 {{ fixed02(condition.amount!.amount) }} {{ condition.amount!.currency }}
  </template>
  <template v-else-if="condition.type === 'WORKFORCE_PROGRAM_START'">启动劳动力计划 </template>
  <template v-else>
    {{ condition.type }}
  </template>
</template>
