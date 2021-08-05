"use strict";
const fs = require("fire-fs");
const utils = Editor.require("packages://cocos-services/panel/utils/utils.js");
const creatorHomePath = Editor.isMainProcess ? Editor.App.home : Editor.remote.App.home;

var agoraVue = Vue.extend({
    template: fs.readFileSync(Editor.remote.App.home + "/services/agora/pages/index.html", "utf-8"),
    props: {
        params: {
            type: Object
        }
    },
    data() {
        return {
            paramList: this.params,
            sdkType: this.params.sdkType || "audio",
        };
    },
    created() {
        this.paramList.sdkType = this.sdkType || "audio";
        this.$emit("save-param", this.paramList);
    },
    methods: {
        utils_t: function (key, ...args) {
            return utils.t(key, ...args);
        },
        saveParam: function () {
            this.paramList.sdkType = this.sdkType;
            this.$emit("save-param", this.paramList);

            if (this.sdkType === "video") {
                utils.copyDir(
                    `${__dirname}/../resources/components/AgoraVideoRender`,
                    creatorHomePath + "/cloud-component/AgoraVideoRender"
                );
            } else {
                utils.removeDir(creatorHomePath + "/cloud-component/AgoraVideoRender");
            }

            utils.printToCreatorConsole("info", this.utils_t("agora.save_param_success"));
        },
    }
});

// 注册Vue组件，组件名由Service后台返回，不可随意命名
Vue.component("service-agora", agoraVue);
