<template>
  <section class="ip-tool" aria-label="IP 工具">
    <div class="ip-content">
      <section class="ip-panel ip-panel--address" aria-label="IPv4 与 IPv6 地址">
        <header class="ip-panel__header">
          <div class="ip-panel__heading">
            <h2 class="ip-panel__title">{{ priorityTitle }}</h2>
          </div>
        </header>

        <div class="ip-address-grid">
          <button
            v-for="profile in ipCards"
            :key="profile.key"
            class="ip-address-card"
            :class="{
              'ip-address-card--active': profile.key === preferredVersion,
              'ip-address-card--empty': !profile.available,
            }"
            type="button"
            :disabled="!profile.available"
            :aria-label="`复制 ${profile.label} 地址`"
            @click="copyAddress(profile)"
          >
            <span class="ip-address-card__label">{{ profile.shortLabel }}</span>
            <span class="ip-address-card__status" :class="{ 'ip-address-card__status--empty': !profile.available }">
              {{ profile.available ? '✔' : profile.loading ? '…' : '!' }}
            </span>
            <strong class="ip-address-card__value">{{ profile.addressText }}</strong>
            <span class="ip-address-card__copy">{{ copiedVersion === profile.key ? '已复制' : profile.available ? '复制' : profile.loading ? '获取中' : '未获取到' }}</span>
          </button>
        </div>

      </section>

      <div class="ip-info-row">
        <aside class="ip-tabs-panel" aria-label="IP 类型切换">
          <div class="ip-tabs">
            <button
              class="ip-tabs__item"
              :class="{ 'ip-tabs__item--active': selectedVersion === 'overview' }"
              type="button"
              :aria-pressed="selectedVersion === 'overview'"
              @click="selectVersion('overview')"
            >
              总览
            </button>
            <button
              class="ip-tabs__item"
              :class="{ 'ip-tabs__item--active': selectedVersion === 'ipv4' }"
              type="button"
              :aria-pressed="selectedVersion === 'ipv4'"
              @click="selectVersion('ipv4')"
            >
              IPv4
            </button>
            <button
              class="ip-tabs__item"
              :class="{ 'ip-tabs__item--active': selectedVersion === 'ipv6' }"
              type="button"
              :aria-pressed="selectedVersion === 'ipv6'"
              @click="selectVersion('ipv6')"
            >
              IPv6
            </button>
          </div>
        </aside>

        <article class="ip-panel ip-panel--details" :class="{ 'ip-panel--collapsed': collapsedPanels.details }">
          <header class="ip-panel__header">
            <div class="ip-panel__heading">
              <span class="ip-panel__eyebrow">网络信息</span>
              <h2 class="ip-panel__title">{{ activeIpInfo.label }} 网络概览</h2>
            </div>
            <button
              class="ip-section__toggle"
              type="button"
              :aria-expanded="!collapsedPanels.details"
              @click="togglePanelCollapsed('details')"
            >
              {{ collapsedPanels.details ? '展开' : '收起' }}
            </button>
          </header>

          <Transition
            :css="false"
            name="ip-collapse"
            @before-enter="beforeCollapseEnter"
            @enter="collapseEnter"
            @after-enter="afterCollapseTransition"
            @enter-cancelled="afterCollapseTransition"
            @before-leave="beforeCollapseLeave"
            @leave="collapseLeave"
            @after-leave="afterCollapseTransition"
            @leave-cancelled="afterCollapseTransition"
          >
            <div v-if="!collapsedPanels.details" class="ip-secondary">
              <section class="ip-section ip-section--muted" aria-label="网络信息">
                <div class="ip-section__header">
                  <h2 class="ip-section__title">网络</h2>
                  <button
                    class="ip-section__toggle"
                    type="button"
                    :aria-pressed="hiddenPanels.network"
                    @click="togglePanelHidden('network')"
                  >
                    {{ hiddenPanels.network ? '显示' : '隐藏' }}
                  </button>
                </div>
                <div class="ip-mask-wrap">
                  <dl class="ip-list">
                    <div>
                      <dt>ASN</dt>
                      <dd>{{ activeIpInfo.asn }}</dd>
                    </div>
                    <div>
                      <dt>运营商</dt>
                      <dd>
                        <span class="ip-list__carrier">
                          <img v-if="activeIpInfo.carrierLogo" class="ip-list__carrier-logo" :src="activeIpInfo.carrierLogo" alt="" />
                          {{ activeIpInfo.carrier || activeIpInfo.isp }}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>连接</dt>
                      <dd>{{ activeIpInfo.networkType }}</dd>
                    </div>
                  </dl>
                  <div v-if="hiddenPanels.network" class="ip-mask-layer" aria-hidden="true">
                    <span>已隐藏</span>
                  </div>
                </div>
              </section>

              <section class="ip-section ip-section--muted" aria-label="地理位置信息">
                <div class="ip-section__header">
                  <h2 class="ip-section__title">地理位置</h2>
                  <button
                    class="ip-section__toggle"
                    type="button"
                    :aria-pressed="hiddenPanels.location"
                    @click="togglePanelHidden('location')"
                  >
                    {{ hiddenPanels.location ? '显示' : '隐藏' }}
                  </button>
                </div>
                <div class="ip-mask-wrap">
                  <dl class="ip-list">
                    <div>
                      <dt>国家</dt>
                      <dd>{{ activeIpInfo.country }}</dd>
                    </div>
                    <div>
                      <dt>地区</dt>
                      <dd>{{ activeIpInfo.region }}</dd>
                    </div>
                    <div>
                      <dt>城市</dt>
                      <dd>{{ activeIpInfo.city }}</dd>
                    </div>
                    <div>
                      <dt>时区</dt>
                      <dd>{{ activeIpInfo.timezone || '未提供' }}</dd>
                    </div>
                  </dl>
                  <div v-if="hiddenPanels.location" class="ip-mask-layer" aria-hidden="true">
                    <span>已隐藏</span>
                  </div>
                </div>
              </section>
            </div>
          </Transition>
        </article>
      </div>

      <section
        class="ip-map-panel"
        :class="{ 'ip-map-panel--collapsed': collapsedPanels.map }"
        aria-label="物理地图"
      >
        <div class="ip-map-panel__header">
          <h2 class="ip-section__title">物理地图</h2>
        </div>
        <div
          class="ip-map-collapse"
          :class="{ 'ip-map-collapse--open': !collapsedPanels.map }"
          @transitionend="handleMapCollapseTransitionEnd"
        >
          <div class="ip-map-collapse__body">
            <IpLocationMap
              ref="locationMap"
              :profile="activeIpInfo"
            />
          </div>
        </div>
        <button
          class="ip-map-panel__toggle"
          type="button"
          :aria-expanded="!collapsedPanels.map"
          @click="togglePanelCollapsed('map')"
        >
          {{ collapsedPanels.map ? '向下展开' : '收起地图' }}
        </button>
      </section>
    </div>

    <aside class="ip-command-panel" aria-label="常用 Bash 命令">
      <header class="ip-panel__header ip-command-panel__header">
        <div class="ip-panel__heading">
          <span class="ip-panel__eyebrow">Bash 命令</span>
          <h2 class="ip-panel__title">常用查询</h2>
        </div>
        <span class="ip-panel__scope">点击复制</span>
      </header>

      <div class="ip-command-list">
        <button
          v-for="item in bashCommands"
          :key="item.key"
          class="ip-command-item"
          type="button"
          :aria-label="`复制命令 ${item.command}`"
          @click="copyCommand(item.key, item.command)"
        >
          <div class="ip-command-item__top">
            <span class="ip-command-item__label">{{ item.label }}</span>
            <span class="ip-command-item__meta">{{ copiedCommand === item.key ? '已复制' : item.meta }}</span>
          </div>
          <code class="ip-command-item__code">{{ item.command }}</code>
        </button>
      </div>
    </aside>
  </section>
</template>

<script src="./ToolsPage.js"></script>
<style scoped src="./ToolsPage.css"></style>
