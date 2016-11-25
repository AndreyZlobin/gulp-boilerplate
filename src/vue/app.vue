<style>

    .red {
        color: #f00;
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