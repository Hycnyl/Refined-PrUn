# 更新日志

## Unreleased

## 1.1.11-cn.1

### 汉化

- 以 OOG 版 1.1.11 为基线，汉化扩展界面、设置、帮助、状态、提示和更新日志；优先沿用 SupCH/refined-prun-cn 已有译文。
- 保留 OOG 功能、命令及数据格式，提供通过 GitHub Actions 构建的解压缩扩展包。

## 1.1.11

### 新增

- `nots-notification-type-label`：为路线完成、路线中止（无法飞行或缺少许可）、货运过大及货运未卸下等飞船路线通知增加路线标签。

### 调整

- `XIT FLOW`：买卖价格默认使用定价交易所的 VWAP7D，不再分别使用卖一和买一价格。做市商材料使用做市商买价，按材料单独设置的价格仍然生效。

### 修复

- `XIT TRANSITS`：支持计算无 FTL 引擎飞船的航程。执行不再因“FTL 燃料未确认”停止；上一航段沿用的燃料或反应堆用量若超出下一航段范围，会从最近的范围端点开始。
- `XIT TRANSITS`：已打开的窗口会跟随 ROUTECONFIG 站点的增删和排序变化。执行中的站点若与当前路线不一致，结果不会保存到路线，并提示重新运行 TRANSITS。
- `cxos-hide-delete-filled`：CXOS 筛选折叠时，重新隐藏“删除已成交”按钮。
- `XIT CXOS`：打开材料详情时会展开已折叠的筛选区域，确保窗口按该材料和交易所筛选。
- `flt-shorten-addresses`：仅缩短位置和目的地列，保留飞船名称和路线列。
- `unclipped-tooltips`：长提示按屏幕宽度换行，并保留原有换行。

### 移除

- `contd-upward-search-results`：游戏已在窗口外显示 CONTD 用户搜索结果。

## 1.1.10

### 新增

- `XIT LOWSTRIFE`：增加维修开关（默认关闭）和时间偏移（与 REPAIRACT 一样默认为 1）。启用维修后，装载计划包含基地所有生产建筑的维修材料，计入货舱占用但不减少生产天数。维修行在天数列标注维修，可像消耗材料一样取消勾选。

### 修复

- `XIT ROUTECONFIG`：“设置路线”会搜索每个站点，能快速选择不属于玩家基地、仓库或交易所的星球，无需停下来手动选择。
- `flt-ship-condition` / `flt-flight-status-icons`：适配游戏移除应答机列后的 FLT 布局，状况标签重新显示在船名旁，状态样式应用于状态列。

### 移除

- `flt-hide-transponder`：游戏已移除应答机列，此功能在新布局中会误隐藏船名。

## 1.1.9

### 调整

- `XIT ROUTECONFIG`：游戏路线更新已上线正式服，“设置路线”可在正式服运行，移除此前代替它的预览按钮。

## 1.1.8

### 调整

- `XIT LOWSTRIFE`：消耗品天数为 0 时，仅尽量多装生产原料，再用 DW 填满剩余空间。
- `XIT LOWSTRIFEACT`：装载后 SFC 的目的地为本次补给基地。增加与 BURNACT、REPAIRACT、GOVBURNEXEC 相同的按基地自动 SFC 开关。
- `XIT ACT` 的快速入门补给星球选择，以及执行时配置的补给、维修星球选择，还有 `XIT TODO` 的补给和维修任务，均支持输入搜索。输入基地名称或星球编号后，用鼠标或方向键及回车选择。TODO 按游戏顺序排列基地。
- `XIT ACT` 的 MTRA、CONT 材料选择，CONTD 粘贴导入和全部填充，以及单行 XIT 工具栏，兼容当前和即将更新的游戏客户端。

### 修复

- `XIT LOWSTRIFE`：恰好装满飞船不再被标红为超载，执行按钮保持可用。

## 1.1.7

### 新增

- `XIT ROUTECONFIG`：测试功能，详情见 https://oogcapitalmanagement.com/posts/oog-fork-shipping-routes-preview/ 。通过拖放交易所和基地安排站点顺序，选择飞船并设置补给天数。各站显示装卸货和燃料，TRANSITS 计算各航段时间。“设置路线”在游戏 RT 编辑器中创建路线，需要游戏路线更新（当时仅测试服可用）。
- `XIT TRANSITS`：使用蓝图计算拟定路线的飞行时间和燃料，并设置是否使用星门。
- `XIT ROUTEBURN`：每条已保存路线一行，显示最低补给、生产和维修余量，分为自动循环路线和按需路线。各交易所起点显示补货倒计时；补货按钮采购路线补给天数内即将出发的物资；分配按钮采购按需路线的缺口并分配飞船。
- `XIT ROUTETRACK`：显示执行游戏路线的飞船、下次抵达时间，以及路线结束或开始下一轮的时间。
- `cont-fulfill-route-stock`：CONT 履约将动用路线补货预留的交易所仓库库存时要求确认。ACT 的 MTRA 转移同样确认，交易所购买和加油则不将这些库存计为可用。
- `XIT CXOS`：由 Taiyi 贡献，按材料汇总近期交易所成交，并在有效卖单旁显示交易所库存。点击材料代码，在 CXPO 旁打开对应材料的 CXOS 筛选详情。交易所、类别和搜索筛选需要 PRO 订阅。
- `cxo-ticker-details-link`：CXO 中的材料代码与交易所链接打开 XIT CXOS 详情，而非 CXP。
- `XIT LOWSTRIFE`：基于 Lowstrife 表格的星球装载规划器。选择飞船后，装载指定天数的消耗品（默认 60），尽量多装生产原料，再用 DW 填满剩余空间。执行按钮通过 LOWSTRIFEACT 装载，复制按钮复制动作包 JSON。

### 调整

- `XIT SET` 路线页：增加路线补给天数及 ROUTEBURN 起点倒计时的红黄阈值。

### 修复

- `XIT AGENT`：星球设为执行时配置的动作包，例如 BURNACT、REPAIRACT、GOVBURNEXEC 发送的单组动作包，会在打开 SFC 前装载基地产品。
- `XIT BS`：消耗天数按未舍入值着色，与 BURN 一致。例如黄色阈值为 7 时，7.3 天显示绿色。

## 1.1.6

### 调整

- `nots-shift-click-mark-read`：按住 Shift 点击，会以联动方式打开与普通点击相同的窗口，因此商会计划变更通知打开续期投票，飞船抵达通知打开 SHPI。NOTS 停靠在屏幕中时，Shift 点击等同普通点击。Ctrl 点击仍标记已读。

### 修复

- `XIT BS`：命令菜单打开后，鼠标移开仍保留该行灰色高亮，直到再次点击命令。

## 1.1.5

### 新增

- 维修设置：全局维修设置移至 `XIT SET` 基础设置，包括目标楼龄（默认 60）和红黄阈值（默认 3 / 7）。增加倒计时开关：启用时，BS 和 DISPATCH 的维修单元格显示距星球目标或全局目标的剩余天数；关闭时仍显示递增楼龄。
- `XIT FLTBUTTONS`：设置基地或交易所飞船在空载或载货时的卸货按钮颜色，默认空载为蓝色、载货为橙色。
- `XIT SET SFC`：最多四个目的地快捷键，每个包含标签和交易所或星球目的地。默认 ANT、BEN、HRT、MOR。目的地留空会隐藏按钮，飞船已在目的地时按钮变灰。
- `XIT GOVBURNACT`：增加默认关闭的强制交易所购买。启用后，购买清单忽略仓库已有库存；其他购买动作包仍会扣除库存。
- `XIT SET` 动作页：增加默认关闭的 BS 天数一位小数选项。启用后，低于 10 天的消耗余量显示一位小数；关闭时保留整数。
- `XIT INV`：点击名称打开 BS、SHP 或 CX，容量条仍打开库存。
- `lm-link`：SHPI 在交易所或有本地市场的星球显示 LM 链接，SHP、SHPF、SFC 链接移除飞船 ID。星球右键菜单使用相同的 LM 命令。
- `XIT BURNACT`：增加默认开启且全局保存的加油开关。启用后，动作包先为所有交易所飞船加油。
- `xit-conts-collapse-long-cells`：默认启用。CONTS 的标的物、对方进度和自身进度单元格显示前三项，再以省略号收起。
- `unclipped-tooltips`：提示框可超出窗口边界。
- `chat-command-links`：公司、伙伴和用户聊天中，反引号内的文字显示为命令链接。
- `favicon-notification-badge`：标签页图标显示未读通知数量，最多 99。
- `inv-ship-names`：INV 中的飞船行将船名显示为 SHP 链接。
- `inv-ship-destination-location`：INV 位置列显示飞行中飞船的目的地。
- `XIT HELP AGT`：增加同步代理指南，也可用 HELP AGENT 打开。AGENT 中增加入口按钮。

### 调整

- `XIT NOBUY`：禁止购买编辑器移入 SET 动作页，NOBUY 直接打开此页，存储列表保持原样。
- `XIT BS`：点击命令单元格展开，再次点击折叠。
- `XIT DISPATCH`：Shift 点击消耗值展开基地消耗行，普通点击仍打开 BURN。
- 自动 SFC 在确认起飞后立即准备下一阶段，移除两秒暂停。下一航行仍等待起飞状态确认，或由玩家跳过。
- `XIT PRUNSTAT`：财务报告快捷链接改为 prun.raylu.net/stats。
- `correct-commands`：可直接匹配的空间站命令，例如 LM HRT，统一转为大写。
- `XIT BURN`：窗口标题改为 BURN。
- `XIT FLOW`：材料代码列仍可排序，移除其文字表头。
- `nots-shift-click-mark-read`：Shift 点击在 NOTS 旁打开通知目标的联动窗口；Ctrl 点击仅标记已读；普通点击保持原样。
- `XIT CONTC`：无截止日期的条件排在有日期条件之后，再按类型、地址、目的地、材料代码和数量排序。

### 修复

- `XIT AGENT`：巡回收货中非原料的收取步骤在飞船仍停靠时运行，随后只打开一次 SFC。
- `XIT ACT`：失败或取消的步骤会停止动作包，缺少交易所订单簿会使该步骤失败。货物和燃料按库存 ID 存储，无名飞船不再遮蔽有名飞船。
- `XIT ACT`：订单簿无法成交任何数量时跳过购买，不再占用下一笔购买的执行点击。
- 短窗口中的 APEX alpha 标签保持在左侧边栏快捷键后方。
- `XIT FXTS`：每日合计同时包含材料数量和对应货币数额。
- POPID ALL 无法将储备滑块移至最大值时跳过该滑块。
- `XIT ACT`：按飞船容量计算在窄面板中可换行。
- 交易所价格预览：低于 Refined PrUn 估值时显示低于百分比，不使用警告色；等于或高于估值时仍显示超出百分比。
- `XIT FLT`：船名和维修列打开 SHP；级别、状态和预计到达打开 SFC；容量和货物打开 SHPI；燃料打开 SHPF。
- `XIT DISPATCH`：SET 窗口尺寸规则保留宽度和高度。

### 移除

- 全局及按星球设置的维修时间偏移，REPAIRACT 自身的时间偏移保留。

## 1.1.4

### 新增

- `XIT BURNACT`：记住各基地所选交易所，后续默认使用该交易所及其仓库。
- `XIT FLT`：可用名称参数（例如 FLT ANT、FLT ZV-307a）筛选星系或星球中的飞船。交易所代码按 FLTS 方式解析，例如 ANT 对应 Antares I。
- `nots-cogc-repeat-vote`：点击商会计划变更通知时打开 COGCPD，并填入星球和计划，以便投票续期。
- `XIT BS`：增加动态排序开关，按消耗余量和维修楼龄中更接近红色阈值的一项排列基地。
- `act-auto-close`：在 SET 中默认关闭。启用后，成功执行动作包会关闭 ACT、BURNACT、REPAIRACT、DISPATCHACT、GOVBURNEXEC 等对应窗口。
- `XIT BURNACT` / `XIT REPAIRACT` / `XIT GOVBURNEXEC`：在 MTRA 目的地下增加默认开启的自动 SFC。关闭状态按基地保存，关闭后不再自动打开 SFC。
- `XIT NOBUY`：黄色和红色百分比字段（默认 10 / 20），用于警告高于 Refined PrUn 估值的购买。
- `XIT DISPATCH` / 交易所购买：增加默认关闭的价格预览。每个缺失价格的交易所类别需要一次执行点击，再在交易所面板显示按成本排序的预览。
- `XIT NOBUY`：所有材料选项可禁止购买全部材料，同时保留单独指定的材料列表。

### 调整

- `XIT DISPATCH/AGENT`：重大调整。一艘飞船服务多个基地时，同步代理计入沿途站点可用的原料，不再从交易所购买完整清单。装载单元格显示路线峰值，避免中途超载。
- 引入上游带类型的 L 本地化接口，界面文字匹配改用本地化键及英文回退，替代旧 PrunI18N 字典。
- `XIT BURNACT`：按飞船容量计算仅提供当前拥有的飞船规格。
- `XIT ACT`：交易所购买价格超过 NOBUY 红黄阈值时，在执行或跳过前显示阻塞式价格警告及超出幅度。

### 修复

- `sfc-flight-cost`：SFC 费用以空格或撇号分隔千位时，不再低估航行费用。

## 1.1.3

### 新增

- `XIT FLOW`（Erendrake 贡献）：跨基地按材料显示每日生产、消耗（含劳动力）、净变化及其价值。点击买卖价可设置仅作用于 FLOW 的价格；星球和 NOT 参数使用 BURN 的语法。
- `XIT FINCH`：增加权益增长率图表，也可用 FINCH EQUITY GROWTH 打开，显示各数据点间每日权益变化百分比。
- `nots-shift-click-mark-read`：Shift 点击 NOTS 行可标记已读而不打开目标，也不会选择页面文字。
- `ship-unload-to-warehouse`：Shift 点击已着陆飞船的卸货控件，将货物移入当地仓库。
- `XIT DATA`：内存数据目录增加只读的 burn、repair 和 planet-settings 来源。

### 调整

- `XIT BS`：点击基地消耗天数内联展开其消耗行，Shift 点击在新窗口打开对应 BURN。
- `XIT FLT`：燃料表头改为与其他表头同字号的灰色加油按钮，打开 REFUELACT，移除独立加油按钮。
- `XIT BURNACT` / `XIT DISPATCH`：按飞船容量计算的精度由整数天改为 0.01 天。

### 修复

- `XIT DISPATCHACT`：首次 SFC 阶段通过游戏消息设置窗口尺寸，不再直接写入 975×750 样式，后续拖动调整可正常保留。
- `XIT AGENT`：即使其他通讯窗口先恢复，也能从 refined-agent 频道加载动作包。
- `XIT BURN`：生产与消耗相抵的材料不再显示为剩余 0 天，星球行和总体行均适用。

## 1.1.2

### 新增

- `shortcut-placeorder`：输入交易所简称和材料代码（例如 a dw）即可打开对应交易所的 CXPO。简称包括 a=ANT、b=BEN、i=HRT、h=HUB、l=ARC。
- `XIT DISPATCH`：点击星球消耗或维修值，打开对应的 BURN 或 REP 详情。

### 修复

- `XIT ACT`：等待游戏操作的最终成功或错误状态，避免偶发中止已经成功的步骤。

## 1.1.1

### 新增

- `XIT WHATSNEW`：显示版本更新说明，更新后自动打开。
- `XIT GOVBURN`：在配置面板中从 JSON 导入星球 POPI 计划，并预览将覆盖的内容。
- `bs-inv-base-store-link`：BS 上下文栏中的 INV 链接直接打开基地库存。
- `XIT BS`：基地成品将在 24 小时内装满 PLANETS 指定规格的飞船时，在库存条旁显示绿色 🚀；已有飞船飞往该基地时隐藏。
- `XIT PLANETS`：增加收货列，可指定飞船容量，在 24 小时内有足够产品装满时接收提示。
- `production-companion-buffers`：Shift 点击 PROD、PRODQ 或 PRODCO 中的生产线按钮，并排打开 PRODCO 和 PRODQ 联动窗口。

### 调整

- `XIT GOVBURNACT`：保存维护材料栏位选择，不再每次打开窗口时重新猜测。
- `correct-commands`：INV 加星球参数直接打开基地库存，而非库存列表。
- `XIT ACT`：自动 SFC 使用与 CONTD 导入相同的地址选择方法设置目的地，移除两次冗余确认。
- `XIT ACT`：交易所库存不足不再中止整个动作包。购买步骤警告后提供可成交数量，玩家可执行部分购买、手动调整或跳过。
- `popi-details-companion-buffer`：联动窗口使用各命令注册的尺寸，不再固定为 450 像素；分隔线按这些尺寸定位，不再固定平分。

### 修复

- `XIT DATA`：改善代理查询连接和参数处理的稳定性。
- `XIT DISPATCH`：长船名保持在单元格内，并加宽飞船列以显示更多名称。

## 1.1.0

### 说明

- 既有功能和 1.1.0 补丁内容见 https://chromewebstore.google.com/detail/oog-rprun-test-fork/pcakabdnefjhjdgbiapchkejbkhdeebn 。
