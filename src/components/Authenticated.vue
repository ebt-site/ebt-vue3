<template>
<div class="auth-grp">
Authenticated
    <v-tabs v-model="tabsModel" v-if="token"
       class="auth-tabs"
       dark :color="tabsColor"
       slider-color="grey lighten-4">
        <v-tab>
            {{ "$vuetify.lang.t('$vuetify.auth.users')" }}
        </v-tab>
        <v-tab-item dark>
            <!--admin-users/-->
        </v-tab-item>
        <v-tab v-if="isAdmin"> 
            {{ "TODO:$vuetify.lang.t('$vuetify.auth.caches')" }}
        </v-tab>
        <v-tab-item v-if="isAdmin"> 
            <!--caches/-->
        </v-tab-item>
        <v-tab v-if="isAdmin"> 
            {{ "TODO:$vuetify.lang.t('$vuetify.auth.releases') "}}
        </v-tab>
        <v-tab-item v-if="isAdmin"> 
            <!--releases/-->
        </v-tab-item>
        <v-tab v-if="isAdmin"> 
            {{ "TODO:$vuetify.lang.t('$vuetify.auth.vsm') "}}
        </v-tab>
        <v-tab-item v-if="isAdmin">
            <!--vsm/-->
        </v-tab-item>
        <v-tab v-if="isAdmin"> 
            {{ "TODO:$vuetify.lang.t('$vuetify.auth.contentUpdaterTab')" }}
        </v-tab>
        <v-tab-item v-if="isAdmin">
            <!--content-updater/-->
        </v-tab-item>
        <v-tab v-if="isAdmin"> 
            {{ "TODO:$vuetify.lang.t('$vuetify.auth.logs')" }}
        </v-tab>
        <v-tab-item v-if="isAdmin">
            <!--logs/-->
        </v-tab-item>
        <v-tab v-if="isAdmin"> 
            {{ "$vuetify.lang.t('$vuetify.auth.sounds')" }}
        </v-tab>
        <v-tab-item v-if="isAdmin">
            <!--sounds/-->
        </v-tab-item>
    </v-tabs>
    <login/>
</div>
</template>

<script>
/* eslint no-console: 0*/
//TODO: import AdminUsers from "./admin-users";
//TODO: import Vsm from "./vsm";
//TODO: import ContentUpdater from './content-updater';
//TODO: import Logs from "./logs";
//TODO: import Sounds from "./sounds";
//TODO: import Caches from "./caches";
//TODO: import Releases from "./releases";
//TODO: import Login from "./login";

const TODO = 1

export default {
    name: 'Authenticated',
    data: () => {
        return {
            user: {
                isTranslator: false,
                isEditor: false,
            },
            tabsModel: null,
            isWaiting: false,
            loginError: null,
        }
    },
    methods: {
        url(path) {
          var origin = window.location.origin;
          return origin.endsWith(':8080') 
            ? `${origin.substring(0, origin.length-5)}:3000/scv/${path}` 
            : `./${path}`;
        },
    },
    mounted() {
        this.user = this.gscv.user;
    },
    computed: {
        gscv() {
            return this.$root.$data;
        },
        token() {
            return TODO || this.user && this.user.token;
        },
        isEditor() {
            return this.user.isEditor
        },
        isTranslator() {
            return this.user.isTranslator
        },
        isAdmin() {
            return TODO || this.user.isAdmin
        },
        tabsColor() {
            return this.isAdmin
                ? "grey lighten-5 "
                : "indigo darken-2"
        },
    },
    components: {
        //TODO: AdminUsers,
        //TODO: Caches,
        //TODO: Releases,
        //TODO: ContentUpdater,
        //TODO: Vsm,
        //TODO: Logs,
        //TODO: Login,
        //TODO: Sounds,
    },
}
</script>

<style scoped>
.auth-grp {
    display: flex;
    flex-flow: column;
    justify-content: center;
    align-items: center;
}
a.v-tabs__item {
    color: #ff00ff !important;
}
.auth-tabs {
    width: 100%;
    margin: 0em !important;
    padding: 0em !important;
}
</style>
