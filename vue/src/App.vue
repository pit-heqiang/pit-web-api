<template>
  <div id="app" class="web-api">
    <el-card class="box-card" shadow="never">
      <div slot="header" class="clearfix">
        <span>获取swagger服务列表(第一步)</span>
      </div>
      <el-form ref="basicsForm" :model="basicsForm" :rules="basicsRules" label-width="80px">
        <el-form-item label="Ip地址" prop="ip">
          <el-radio-group v-model="radio" @change="basicsForm.ip = ''; basicsForm.requestUrl=''">
            <el-radio :label="0">默认配置</el-radio>
            <el-radio :label="1">自定义</el-radio>
          </el-radio-group>
          <el-input v-model="basicsForm.ip" v-if="radio == 1" placeholder="例如：http://xxx.xx.xx.xxx:8181"></el-input>
          <el-select v-model="basicsForm.ip" @change="handleBasicsIp" placeholder="请选择swagger地址" style="width:100%"
            v-else>
            <el-option v-for="item in webApiConfig.paths" :key="item.ip" :label="item.ip" :value="item.ip">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="请求地址" prop="requestUrl">
          <el-input v-model="basicsForm.requestUrl" :disabled="radio != 1" placeholder="例如：/v3/api-docs/swagger-config">
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="web-api-btn" id="copybuttons" :data-clipboard-text="template"
            @click="handleBasics">获取接口服务</el-button>
        </el-form-item>

      </el-form>
    </el-card>
    <el-card class="box-card" shadow="never">
      <div slot="header" class="clearfix">
        <span>根据服务生成接口树(第二步)</span>
      </div>
      <el-form ref="form" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="接口服务" prop="requestUrl">
          <el-select v-model="form.requestUrl" placeholder="请选择接口服务" style="width:100%">
            <el-option v-for="item in serviceUrls" :key="item.url" :label="item.name" :value="item.url">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="调用接口方法名" prop="apiFuncName">
          <el-input v-model="form.apiFuncName" placeholder="例如：axios,request等"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTreeData">获取树数据</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="box-card box-card-tree" shadow="never">
      <div slot="header" class="clearfix">
        <span>生成api模板(第三步)</span>
      </div>
      <div class="tree">
        <el-tree :data="treeData" :default-expanded-keys="['root']" ref="tree" show-checkbox :node-key="props.rowKey"
          :props="props">
        </el-tree>
      </div>
      <div class="tree-btn">
        <el-button type="primary" @click="handleClickGenerateApi">生成api模板</el-button>
      </div>
    </el-card>
    <el-card class="box-card box-card-template" shadow="never">
      <div slot="header" class="clearfix">
        <span>复制模板(完成)</span>
      </div>
      <el-input type="textarea" v-model="template" rows="15"></el-input>
      <el-button type="primary" class="web-api-btn" id="copybuttons" :data-clipboard-text="template"
        @click="handleCopy">复制</el-button>
      <el-button @click="template=''">清空</el-button>
    </el-card>
  </div>
</template>

<script>

import axios from "axios";
import { v4 as uuidv4 } from 'uuid'
import Clipboard from 'clipboard'
import _ from "loadsh"
import { handleParameter, repeatElement } from '@/utils'
export default {
  data() {
    return {
      basicsForm: {
        ip: '',
        requestUrl: ''
      },
      basicsRules: {
        ip: { required: true, message: 'ip地址不能为空', trigger: ['blur', 'change'] },
        requestUrl: { required: true, message: '请求地址不能为空', trigger: ['blur', 'change'] },
      },
      form: {
        requestUrl: '',
        apiFuncName: 'request'
      },
      props: { 'children': 'children', 'label': 'name', 'rowKey': 'id' },
      vscodeApi: null,
      treeData: [],
      template: '',
      rules: {
        requestUrl: { required: true, message: '接口服务不能为空', trigger: ['blur', 'change'] },
        apiFuncName: { required: true, message: '调用接口方法名不能为空', trigger: ['blur', 'change'] }
      },
      webApiConfig: {},
      radio: 1,
      serviceUrls: []
    };
  },
  mounted() {
    let _this = this;
    _this.vscodeApi = acquireVsCodeApi && acquireVsCodeApi();
    window.addEventListener('message', function (e) {
      _this.webApiConfig = e.data.webApiConfig || {};
      let paths = _.get(_this.webApiConfig, 'paths', []);
      if (paths.length) {
        _this.radio = 0;
        Object.assign(_this.basicsForm, paths[0]);
      }
      _this.webApiConfig.apiFuncName && _this.$set(_this.form, "apiFuncName", _this.webApiConfig.apiFuncName);
    })
  },
  methods: {
    handleBasicsIp(val) {
      const obj = this.webApiConfig.paths.find(item => item.ip == val) || {};
      this.basicsForm.requestUrl = obj.requestUrl;
    },
    getTreeData() {
      this.$refs['basicsForm'].validate((valid) => {
        if (valid) {
          this.$refs['form'].validate((valid) => {
            if (valid) {
              axios({
                methods: 'get',
                url: this.basicsForm.ip + this.form.requestUrl,
              }).then((res) => {
                let obj = _.get(res, 'data.paths', []);
                this.vscodeApi && this.vscodeApi.postMessage({
                  command: 'tips',
                  text: '获取树数据成功'
                })
                this.treeData = this.dataProcessing(obj);
              })
            }
          });
        }
      });

    },
    // 处理数据
    dataProcessing(data) {
      const arr = []
      for (const key in data) {
        for (const key1 in data[key]) {
          data[key][key1].path = key
          data[key][key1].method = key1
          arr.push(data[key][key1])
        }
      }
      const menu = []
      let tagsList = []
      arr.forEach(item => {
        tagsList = [...tagsList, ...item.tags]
      })
      const result = Array.from(new Set(tagsList))

      result.forEach(item => {
        const obj = {}
        obj.id = uuidv4()
        obj.name = item
        obj.children = this.getChildrenItem(arr, item)
        menu.push(obj)
      })
      return menu.length ? [{
        path: '',
        methods: '',
        name: '所有',
        id: 'root',
        children: menu
      }] : [];
    },
    getChildrenItem(data, key) {
      const arr = []
      for (let i = 0; i < data.length; i++) {
        if (data[i].tags.includes(key)) {
          const obj = {}
          obj.id = uuidv4()
          obj.name = data[i].summary
          obj.data = data[i]
          arr.push(obj)
        }
      }
      return arr
    },
    handleBasics() {
      this.$refs['basicsForm'].validate((valid) => {
        if (valid) {
          axios({
            methods: 'get',
            url: this.basicsForm.ip + this.basicsForm.requestUrl,
          }).then((res) => {
            this.serviceUrls = _.get(res, 'data.urls', []);
            this.vscodeApi && this.vscodeApi.postMessage({
              command: 'tips',
              text: '获取服务数据成功'
            })
          })
        }
      });
    },
    camelCase(str) {
      return _.camelCase(str)
    },
    handleClickGenerateApi() {
      let data = this.$refs.tree.getCheckedNodes();
      const codeData = data.filter(item => item?.data?.path);
      if (codeData && codeData.length) {
        const repeatPath = codeData.map(item => item.data.path)
        const repeatResult = repeatElement(repeatPath)

        const regex3 = /\{(.+?)\}/g
        let str = '';
        codeData.forEach(item => {
          let path = ''
          if (repeatResult[1] > 1) {
            if (item.data.path === repeatResult[0]) {
              if (item.data.method === 'post') {
                path = `req-${item.data.path}-save`
              } else if (item.data.method === 'put') {
                path = `req-${item.data.path}-update`
              } else if (item.data.method === 'delete') {
                path = `req-${item.data.path}-delete`
              } else {
                path = `req-${item.data.path}`
              }
            } else {
              path = `req-${item.data.path}`
            }
          } else {
            path = `req-${item.data.path}`
          }
          const apiName = this.camelCase(path)
          str += '/**\n'
          str += '* ' + item.name + '\n'
          str += '* @param data\n'
          str += '* @return {AxiosPromise}\n'
          str += '*/\n'
          // 判断是否有参数
          if (!item.data.path.match(regex3)) {
            str += 'export const ' + apiName + ' = (data) => {\n'
          } else {
            const parameter = handleParameter(item.data.path)
            str += 'export const ' + apiName + ' = (' + parameter + ', data) => {\n'
          }
          str += '  return ' + this.form.apiFuncName + '({\n'
          str += '    url: `' + item.data.path.replaceAll('{', '${') + '`,\n'
          str += '    method: "' + item.data.method + '",\n'
          str += '    data\n'
          str += '  });\n'
          str += '};\n'
          str += '\n'
        })
        this.template = str
      }
    },
    handleCopy() {
      let _this = this;
      let clipboard = new Clipboard('#copybuttons');
      clipboard.on('success', e => {
        _this.vscodeApi && _this.vscodeApi.postMessage({
          command: 'tips',
          text: '复制成功'
        })
        clipboard.destroy()
      })
      clipboard.on('error', e => {
        clipboard.destroy()
      })

    }
  }
};
</script>

<style lang="less" scoped>
.web-api {
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 30px;
  box-sizing: border-box;
  display: flex;
  .el-card {
    margin: 10px;
    height: 500px;
    width: 33%;
  }
  .box-card-tree {
    .tree {
      height: calc(100% - 70px);
      overflow: auto;
    }
    .tree-btn {
      text-align: center;
      margin-top: 10px;
    }
  }
  .box-card-template {
    text-align: center;
    .el-button {
      margin-top: 10px;
    }
  }
}
</style>
