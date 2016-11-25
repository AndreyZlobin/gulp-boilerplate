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
            </div>
        </div>
    </div>

</template>

<script>
    export default {
        data () {
            return {
                msg: 'Hello vue!'
            }
        }
    }
</script>