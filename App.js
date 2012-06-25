Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    itemId:"App",

    leafNodes :[],
    orphanNodes :[],

    launch: function() {

        this.add({
            xtype:"rallyreleasecombobox",
            listeners:{
                change:function(combo) {
                    this._getStoriesInRelease(combo.getValue());
                },
                ready:function(combo) {
                    this._getStoriesInRelease(combo.getValue());
                },
                scope:this
            }

        });
    },

    _getStoriesInRelease:function(release) {
        this.orphanNodes = [];
        this.leafNodes = [];

        var store = Ext.create("Rally.data.WsapiDataStore", {
            model:"story",
            autoLoad:true,
            limit:Infinity,
            filters: [
                {
                    property: 'Release',
                    value: release
                }
            ],
            listeners:{
                load:function(store, records) {
                    this.leafNodes = records;
                    this._getParents(records);
                },
                scope:this
            }
        });
    },

    _getParents:function(children) {
        if (!children.length) {
            return;
        }
        var portfolioItems = [];
        var stories = [];
        Ext.each(children, function(c) {
            var parent = c.get('Parent') || c.get('PortfolioItem');
            if (parent) {
                var ref = new Rally.util.Ref(parent._ref);
                if(ref.getType() === "hierarchicalrequirement"){
                    stories.push(parent);
                }
                else{
                    portfolioItems.push(parent);
                }

            }
        });


    },

    _getPortfolioItems:function() {

        var filter = Ext.create('Rally.data.QueryFilter', {
            property: 'Parent',
            value:Rally.util.Ref.getRelativeUri(refs.pop())
        });
        while (refs.length) {
            filter = filter.or({
                property: 'Parent',
                value: Rally.util.Ref.getRelativeUri(refs.pop())
            });
        }
        var store = Ext.create("Rally.data.WsapiDataStore", {
            model:"story",
            autoLoad:true,
            limit:Infinity,
            filters: [
                {
                    property: 'Release',
                    value: release
                }
            ],
            listeners:{
                load:function(store, records) {
                    this.leafNodes = records;
                    this._getParents(records);
                },
                scope:this
            }
        });
    },

    _getStories:function() {

    }

});
