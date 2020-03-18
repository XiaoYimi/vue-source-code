/*********************************************
 *   开发者: 晨风不可依米(筱依米)              *
 *   wechat: chenfengbukeyimi                *
 *   email: 2590856083@qq.com                *
 *   功能: Vue 框架                           *
 *********************************************/


// 页面初始化
    // 监听数据变化，劫持数据属性 getter, setter 并将观察者记入依赖搜集器
        // observer(data)  监听数据变化
        // defineReactive(data)  劫持数据属性 getter, setter
            // 注意递归数据内部属性
            // 注意劫持新值(object 类型的)数据
        // Dep.target && departFocus.addSub(Dep.target)  添加观察者, 实现 Observer 与 Dep 关联

    // 模板指令解析
        // - 解析元素(标签)属性上的表达式(v-text, v-html, v-model, v-bind, v-on, :, @, (其它指令))
        // - 解析文本插值表达式({{ express }})


// 数据驱动视图
    // vm.$data[expr] 的数据有所变化,执行数据劫持中的 setter
    // setter 会通知 Watcher 进行视图更新(dep.notify())
    // dep.notify() 会找到相应的 Watcher 执行回调修改视图数据

// 视图变化响应数据变化,进而使得数据驱动视图(主要用于表单控件,且该表单控件有 input 事件)
    // 本质上是在表单节点添加监听事件 'input',获取表单控件值进行数据驱动视图


// 模板编译更新视图处理
const compileUtil = {

    // 清空插值表达式引号外的空格,防止出现 data['you']['name '] 获取值错误(属性有空格,找不到值)
    removeNoQMEmpty (expr) {
        // console.log(expr)
        let res = expr.replace(/[\'|\"](.+?)[\'|\"]/g, (...args) => {
            return "'" + args[1].replace(/\s/g, '#') + "'";
        });
        return res.replace(/\s/g, '');
    },
    // 获取表达式值 (expr 格式: name | you.name)
    getValue (expr, vm) {
        return expr.split('.').reduce((provious, current) => {
            return provious[current];
        }, vm.$data);
    },

    // 获取表达式值(用于数据驱动视图)  (expr 格式: {{ name }} | {{you.name}})
    getContentVal (expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getValue(this.removeNoQMEmpty(args[1]), vm);
        });
    },

    // 表单控件数据的双向绑定处理
    setVal (expr, vm, inputVal) {
        return expr.split('.').reduce((previous, current) => {
            previous[current] = inputVal;
        }, vm.$data);
    },

    // 更新函数
    updater: {
        // 更新文本内容
        textUpdater (node, value) { node.textContent = value; },
        // 更新元素内容
        htmlUpdater (node, value) { node.innerHTML = value; },
        // 更新表单控件内容
        modelUpdater (node, value) { node.value = value; },
        // 更新元素属性内容
        attrUpdater (node, name, value) { node.setAttribute(name, value); },
        
    },


    // 编译 v-text 指令 | 插值表达式
    text (node, expr, vm) {
        let value;
        
        if (/\{\{(.+?)\}\}/.test(expr)) {
            // 对文本节点的插值表达式编译
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                
                new Watcher(vm, this.removeNoQMEmpty(args[1]), (newVal) => {
                    // this.updater.textUpdater(node, this.getValue(this.removeNoQMEmpty(args[1]), vm));
                    this.updater.textUpdater(node, this.getContentVal(expr, vm));
                })

                return this.getValue(this.removeNoQMEmpty(args[1]), vm);
            });
        } else {
            // 数据(变化)驱动视图
            new Watcher(vm, expr, (newVal) => {
                this.updater.textUpdater(node, newVal);
            });
            // 对元素节点属性的模板指令编译
            value = this.getValue(expr, vm);
        }
        
        this.updater.textUpdater(node, value);
    },

    // 编译 v-html 指令
    html (node, expr, vm) {
        const value = this.getValue(expr, vm);
        // 数据(变化)驱动视图
        new Watcher(vm, expr, (newVal) => {
            this.updater.htmlUpdater(node, newVal);
        });
        this.updater.htmlUpdater(node, value);
    },

    // 编译 v-model 指令
    model (node, expr, vm) {
        const value = this.getValue(expr, vm);
        // 数据(变化)驱动视图
        new Watcher(vm, expr, (newVal) => {
            this.updater.modelUpdater(node, newVal);
        });

        // 实现数据双向绑定
        node.addEventListener('input', (e) => {
            // 将输入值赋值表达式
            this.setVal(expr, vm, e.target.value);
        }, false);

        this.updater.modelUpdater(node, value);
    },

    // 编译 v-bind 指令
    bind (node, expr, vm, attrName) {
        const value = this.getValue(expr, vm);
        // 数据(变化)驱动视图
        new Watcher(vm, expr, (newVal) => {
            this.updater.attrUpdater(node, attrName, newVal);
        });
        this.updater.attrUpdater(node, attrName, value);
    },
    
    // 编译 v-on 指令 (expr 格式: 来自 methods 内定义的函数名)
    on (node, expr, vm, eventName) {
        // 获取 methods 内定义的函数
        const fn =  vm.$options.methods && vm.$options.methods[expr];
        // 给节点添加监听事件,并将 fn 绑定到 vm 对象
        // bind 的作用: 返回一个固定作用域(vm.$options)的函数,且 call，apply 无法更改 this 指向
        node.addEventListener(eventName, fn.bind(vm.$options), false);
    },


}



// Vue实例作为绑定入口
class Vue {
     constructor (options) {
        // 获取主要参数
        this.$el = options.el;
        this.$data = options.data;
        this.$options = options;

        if (!this.$el) { console.warn('请在 Vue 实例内定义属性 el 作为绑定节点'); }

        // 监听数据变化,并数据劫持并记入依赖
        new Observer(this.$data);

        // 编译模板指令
        new Compile(this.$el, this);

        // this 代理

     }
}


// 监听数据变化,劫持数据
class Observer {
    constructor (data) {
        this.observer(data);
    }


    // 观察数据变化
    observer (data) {
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                // 劫持数据 getter, setter
                this.defineReactive(data, key, data[key]);
            })
        }
    }

    // 数据劫持
    defineReactive (data, key, value) {

        // 使用递归方法数据劫持内层属性
        this.observer(value);

        // 实例化依赖搜集器
        const dep = new Dep();

        // 数据劫持各个属性的 getter, setter
        Object.defineProperty(data, key, {
            configurable: false,
            enumerable: true,
            get () {
                // 添加观察者(实现 Observer 与 Dep 的关联)
                Dep.target && dep.addWatcher(Dep.target);
                return value;
            },
            set: (newVal) => {

                // 对外界所修改(object 类型)的新值进行数据劫持.(this 默认指向 data, 通过箭头函数自动寻找 this, 也就是该类 Observer)
                this.observer(newVal);

                if (newVal !== value) { value = newVal; }

                // 通过依赖搜集器进行通知变化
                dep.notify();
            }
        })
    }
}



// 编译模板指令
class Compile {
    constructor (el, vm) {
        this.el = this.isElement(el) ? el : document.querySelector(el);
        this.vm = vm;


        // 创建文档碎片对象(虚拟DOM)
        const frament = this.createVirtualDom(this.el);

        // 模板编译
        this.compile(frament);

        // 将编译结果挂载到元素节点 el
        this.el.appendChild(frament);
        
    }

    // 判断是否为节点对象
    isElement (el) { return el.nodeType === 1; }

    // 创建文档碎片对象(虚拟DOM)
    createVirtualDom (el) {
        const f = document.createDocumentFragment();
        while (el.firstChild) {
            f.appendChild(el.firstChild);
        }
        return f;
    }

    // 模板编译
    compile (frament) {
        // 获取文档碎片对象(虚拟DOM)的所有孩子节点
        const childNodes = frament.childNodes;

        // 遍历文档碎片对象(虚拟DOM)的所有孩子节点(仅外层)
        [...childNodes].forEach(child => {
            if (this.isElement(child)) {
                // 进行元素节点编译
                this.compileElement(child);
            } else {
                // 进行文本节点编译
                this.compileText(child);
            }

            // 递归遍历文档碎片对象(虚拟DOM)孩子节点的所有孩子节点(内层)
            if (child.childNodes && child.childNodes.length) { this.compile(child); }

        });
    }

    // 进行元素节点(属性的模板指令)编译
    compileElement (node) {
        // console.log(node)

        // 获取当前元素节点的所有属性
        const attributes = node.attributes;
        // console.log(attributes);

        // 遍历当前元素节点的所有属性
        [...attributes].forEach(attr => {
            const {name, value} = attr;
            // 筛选模板指令属性
            if (this.isDireactive(name)) {
                // 处理 v- 指令
                // console.log(name, value)
                const [, direactive] = name.split('-');
                const [dirName, eventName] = direactive.split(':');
                compileUtil[dirName](node, value, this.vm, eventName);

            } else if (this.isDireactive_at(name)) {
                // 处理 @ 指令
                const [, eventName] = name.split('@');
                compileUtil['on'](node, value, this.vm, eventName);

            } else if (this.isDireactive_colon(name)) {
                // 处理 : 指令
                const [, attrName] = name.split(':');
                compileUtil['bind'](node, value, this.vm, attrName);
            }
            
        });
        

    }

    // 判读是否为 v- 指令
    isDireactive (name) { return name.startsWith('v-'); }

    // 判读是否为 @ 指令
    isDireactive_at (name) { return name.startsWith('@'); }

    // 判读是否为 : 指令
    isDireactive_colon (name) { return name.startsWith(':'); }

    // 进行文本节点(插值表达式)编译
    compileText (node) {
        const content = node.textContent;
        if ((/\{\{(.+?)\}\}/).test(content)) {
            compileUtil['text'](node, content, this.vm);
        }
    }
}

// 依赖搜集器 (向 watcher 通知数据变化变化, 添加观察者 watcher)
class Dep {

    constructor () {
        this.watchers = [];
    }

    // 添加观察者 watcher
    addWatcher (watcher) {
        this.watchers.push(watcher);
    }

    // 向 watcher 通知数据变化变化
    notify () {
        // 遍历所有 watcher, 找到对应的 watcher 进行视图更新
        this.watchers.forEach(w => { w.update() });
    }

}


// 观察者 Watcher (更新视图)
class Watcher {
    constructor (vm, expr, cb) {
        
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;

        this.oldVal = this.getOldVal(this.vm, this.expr);
        
    }

    // 获取旧值
    getOldVal () {
        // 实现 Dep 与 Watcher 关联
        Dep.target = this;
        // 获取旧值
        const oldVal = compileUtil.getValue(this.expr, this.vm);
        // 获取完值必须清除,否则造成一系列的 watchers 难以维护(需求中只需要有多少个视图对象更新就有多少个watcher)
        Dep.target = null;
        return oldVal;
    }

    // 更新视图
    update (vm, expr) {
        // 获取新值
        const newVal = compileUtil.getValue(this.expr, this.vm);
        // 新旧值不一致,数据更新视图
        if (newVal !== this.oldVal) { this.cb(newVal); }
    }
}