# FRK 火灾脆弱性 Web GIS MVP 说明文档

## 1. 项目概述

这个 MVP 是一个基于 Web 的 GIS 原型，用于支持西澳南部 FRK 研究区域内遗产地点的火灾脆弱性分析。

当前原型的目标是帮助护林员、遗产研究人员和项目相关方理解火灾相关环境因素如何影响 Aboriginal 和 Non-Aboriginal heritage places。它不是官方火灾预警系统，也不是应急响应产品，而是一个用于早期验证、展示和收集 client feedback 的决策支持工具。

这个 MVP 将 heritage 数据、fuel type、slope、burn options 和 granite influence 整合到一个交互式地图中。用户可以切换不同图层、放大查看道路级别的真实地图、点击 heritage 地点查看信息，并比较 FRK 区域内不同位置的 fire vulnerability。

## 2. 当前已经完成的内容

当前 MVP 包括：

- 使用 OpenStreetMap 作为真实道路底图，可以放大查看 FRK 区域内的道路、城镇和局部地理环境。
- Fire vulnerability 图层，显示 Low、Medium、High 三类脆弱性区域。
- Heritage places 图层，包含 FRK 范围内的 Aboriginal 和 Non-Aboriginal heritage。
- 可点击的 heritage marker 和 polygon，显示关键 heritage 信息和风险信息。
- Burn options 图层，显示 DBCA burn option 区域，作为管理背景信息。
- Granite influence 图层，从 interpreted bedrock geology 数据中筛选 granite / granitoid 相关地质单元。
- Fuel type 图层，显示植被和燃料结构类型。
- Slope 图层，显示地形坡度相关的火势传播条件。
- 左侧图层控制面板，可以单独打开或关闭不同图层。
- 左侧颜色说明，解释每个图层颜色含义。
- 基础 heritage 筛选功能，可以按风险等级和 heritage 类型筛选。

## 3. 目标用户

这个原型主要面向：

- 需要了解 heritage 与火灾暴露关系的护林员和土地管理人员。
- 需要查看 Aboriginal 和 Non-Aboriginal heritage 空间背景的遗产研究人员。
- 需要评估当前数据图层和评分逻辑是否有用的 client 和项目相关方。
- 需要查看可运行 MVP 的课程评审人员。

## 4. 研究区域

MVP 聚焦于西澳南部的 FRK 区域。在 Web App 中，FRK study area 用虚线边界显示。地图打开后会直接定位到 FRK 区域，而不是显示整个澳大利亚。

FRK 被视为主要研究总体。所有处理后的 heritage、burn option、geology、fuel、slope 和 fire vulnerability 输出都被裁剪或筛选到这个区域内。

## 5. 当前地图图层

### 5.1 Fire Vulnerability

Fire Vulnerability 是主要风险图层，使用三种颜色显示 FRK 区域内的相对火灾脆弱性：

- 红色：High vulnerability
- 黄色：Medium vulnerability
- 绿色：Low vulnerability

当前区域风险计算公式是：

```text
Area Fire Vulnerability = Fuel Risk 60% + Slope Risk 40%
```

High 类别被调整为大约代表 FRK 区域内风险最高的 5% 左右。这样做的目的是让地图在研究区域内部更有区分度，而不是大部分区域都被归为 Medium。

### 5.2 Heritage Places

Heritage Places 图层包含：

- Aboriginal heritage places
- Non-Aboriginal State Register heritage places

每个 heritage record 会使用可用的 polygon geometry，同时生成一个可点击的代表点。对于较大或较敏感的 Aboriginal heritage polygon，代表点可以作为等效点击位置，同时保留 polygon 的空间背景。

点击 heritage 后，App 会显示：

- Identifier
- Name
- Heritage type
- Status
- Place type
- Region or LGA
- Fuel class
- Slope information
- Heritage material/type risk
- Burn option context
- Vulnerability score
- Vulnerability level

### 5.3 Burn Options

Burn Options 图层显示 FRK 范围内的 DBCA burn option 区域。

这个图层作为管理背景信息使用，可以帮助用户判断某个 heritage 或高风险区域是否与 planned burn / management context 有重叠。

重要说明：这个图层不是实时 fire protection status，也不能理解为当前实际防火管控范围。

### 5.4 Granite Influence

Granite Influence 图层来自 1:500k interpreted bedrock geology 数据。原型筛选了属性中包含 granite 或 granitoid 相关信息的地质单元。

加入这个图层是因为 geology 对 heritage research 可能有意义，尤其是 rock formation、rock shelter、engraving 等与地质背景相关的 heritage 类型。它也作为 area-level Fire Vulnerability 中 10% 的地质背景因子。它应被理解为 geology context，不代表实地确认的 surface outcrop。

### 5.5 Fuel Type

Fuel Type 图层基于 Bushfire Fuel Classification 数据，显示植被和燃料结构类型，例如：

- Forest / woodland
- Shrubland
- Grassland / cropland
- Wetland / water
- Built-up / bare ground

Fuel type 不等于最终 vulnerability。系统会先把每一种 fuel type 映射成一个 fuel risk score。高风险 fuel 包括 dense forest、pine plantation、shrubland、woodland with shrubby understory 等。低风险 fuel 包括 water、bare ground、built-up areas、sparse grassland 等。

### 5.6 Slope

Slope 图层来自由 DEM 生成的 slope raster，用于表示地形对火势传播的影响。

Slope 被分为：

- Low
- Moderate
- Steep
- Very steep

一般来说，坡度越陡，火势传播风险越高。

## 6. Heritage Vulnerability 评分

每个 heritage place 都会获得一个单独的 vulnerability score。当前评分模型为：

```text
Heritage Vulnerability =
Fuel Risk 45%
+ Slope Risk 25%
+ Heritage Type / Material Risk 25%
+ Burn Context 5%
```

这个模型是在 review 后调整的。之前部分位于 slope raster 边界附近的 heritage 点 slope 为 Unknown，但仍可能被归为 High。现在的版本中，如果 slope 是 Unknown，则该 heritage 不会被评为 High，除非后续补充或确认 slope 数据。

当前 heritage 风险主要考虑三个因素：

- Heritage 周边的 fuel type
- Heritage 所在位置的 slope
- Heritage type 或 material vulnerability

Burn option context 只占较低权重，因为它是管理背景，而不是直接火灾暴露因素。

## 7. Heritage Type / Material Risk

MVP 当前使用简单的 rule-based 方法判断 heritage type / material risk。

示例：

- Modified tree、timber、wood、wooden structure：较高风险
- Painting、rock art、engraving、rock shelter：高风险
- Burial、grave、cemetery：中高风险
- Midden 或 organic deposit：中等到中高风险
- Artefact scatter、quarry、grinding area、groove、sub-surface material：中低风险
- Brick、stone、masonry、concrete：材料脆弱性较低
- 一般 built heritage：中等风险

这只是原型规则，后续需要和 heritage experts 以及 client 一起确认。

## 8. 使用的数据来源

当前 MVP 使用了以下数据：

- Aboriginal Cultural Heritage Register GeoJSON
- Aboriginal Cultural Heritage Lodged GeoJSON
- Heritage Council State Register GeoJSON
- ACH register 和 lodged CSV 属性信息
- DBCA Burn Options Program GeoJSON
- Bushfire Fuel Classification GeoTIFF
- Fuel type classification PDF / attribute table
- 由 DEM 生成的 slope GeoTIFF
- 1 Second DEM
- 1:500k Interpreted Bedrock Geology shapefile

原始数据没有复制到项目目录中。Web App 使用的是项目中生成的轻量化 processed outputs。

## 9. 处理后的输出

MVP 生成了适合浏览器加载的数据，例如：

- `heritage_all_layer.geojson`
- `burn_options_layer.geojson`
- `granite_layer.geojson`
- `fire_vulnerability_overlay.png`
- `fuel_type_overlay.png`
- `slope_overlay.png`
- `metadata.json`

Fire vulnerability、fuel type 和 slope 使用 image overlay，而不是大量 vector grid。这样可以在浏览器中展示约 50-60m 的视觉精度，同时保持性能稳定。

## 10. 当前版本优点

当前 MVP 展示了：

- 多个空间数据集的成功整合。
- 支持真实道路底图的交互式地图。
- 支持 fire vulnerability、fuel、slope、geology、burn options 和 heritage 的图层探索。
- 可以点击 heritage 查看详细信息。
- 有清晰可解释的评分逻辑。
- 已经可以用于 client feedback session。

## 11. 当前限制

当前 MVP 仍有一些限制：

- Fire vulnerability model 是简化原型，不是经过科学验证的正式模型。
- Fuel risk values 是 rule-based，需要 fire ecology 或 land management experts 审查。
- Heritage type/material risk 基于关键词规则，需要 heritage specialists 验证。
- Unknown slope 当前会限制 High 分类，但这些记录后续仍需要空间检查。
- Burn options 只是管理背景，不是实时防火或应急状态。
- Raster overlays 目前主要用于可视化，暂时还不能点击任意 cell 返回 score。
- 当前 App 是本地运行版本，还没有部署到线上服务器。

## 12. 向 Client 收集 Feedback 的问题

展示时可以重点询问：

1. 当前这些 map layers 是否符合你们的工作流程？
2. FRK study area 范围是否正确？
3. 点击 heritage 后显示的信息是否足够？
4. Aboriginal 和 Non-Aboriginal heritage 是否应该默认一起显示，还是分开显示？
5. Fire vulnerability 的红黄绿颜色是否容易理解？
6. 当前 High / Medium / Low 分类是否有用？
7. High 是否应该代表风险最高的约 5%，还是需要其他阈值？
8. Heritage type/material risk 的逻辑是否合理？
9. 哪些 heritage 类型应该被认为最容易受火灾影响？
10. Burn options 应该降低风险、提高关注度，还是只作为背景信息？
11. 是否缺少其他重要图层？
12. 下一版是否需要导出报告或高风险 heritage 列表？

## 13. 建议展示流程

建议展示顺序：

1. 介绍 MVP 的目的。
2. 说明 FRK 是研究区域，地图打开后直接定位到 FRK。
3. 展示道路底图和放大、缩小、平移功能。
4. 打开 Fire Vulnerability，解释红黄绿等级。
5. 打开 Heritage Places，点击几个 heritage record 展示信息。
6. 解释 heritage vulnerability 的计算方法。
7. 打开 Burn Options，说明它是 management context。
8. 打开 Fuel Type 和 Slope，说明它们是环境输入。
9. 打开 Granite Influence，说明它是 heritage research context。
10. 说明当前限制，并向 client 收集 feedback。

## 14. 后续开发方向

后续可以继续开发：

- 点击 Fire/Fuel/Slope raster overlay 后显示该位置的 score。
- 按 heritage name 或 identifier 搜索。
- 增加高风险 heritage 列表。
- 导出单个 heritage 或选中区域的报告。
- 根据 client feedback 调整权重。
- 对 heritage 周边建立 buffer 分析。
- 增加数据质量和 confidence indicators。
- 部署到线上服务器，方便 stakeholder 访问。
