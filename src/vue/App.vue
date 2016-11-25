<style lang="scss">
    $red: red;
    .red {
        color: $red;
    }
</style>

<template>
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <h1 class="red">{{msg}}</h1>
                <hello></hello>
            </div>
        </div>
    </div>

</template>

<script>

    import Hello from './components/Hello.vue'

    export default {

        name: 'app',

        data () {
            return {
                msg: 'Hello vue!'
            }
        },
        components: {
            Hello
        }
    }
</script>