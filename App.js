Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    itemId:"App",

    leafNodes :[],
    orphanNodes :[],
    parentHash:{},


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


    _reset:function() {
        this.parentHash = {};
        this.orphanNodes = [];
        this.leafNodes = [];
        this._outstandingQueries = 0;
    },

    _getStoriesInRelease:function(release) {
        this._reset();
        this._outstandingQueries++;

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
                    this._processResults(records);
                },
                scope:this
            }
        });
    },

    _storeInParentHash:function(parentRef, child) {
        if (this.parentHash[parentRef.getRelativeUri()]) {
            this.parentHash[parentRef.getRelativeUri()].push(child);
        }
        else {
            this.parentHash[parentRef.getRelativeUri()] = [child];
        }
    },

    _outstandingQueries:0,

    _processResults:function(children) {
        this._outstandingQueries--;
        if (!children.length) {
            return;
        }
        var portfolioItems = [];
        var stories = [];
        Ext.each(children, function(child) {
            var parent = child.get('Parent') || child.get('PortfolioItem');
            if (parent) {
                var parentRef = new Rally.util.Ref(parent._ref);
                if (parentRef.getType() === "hierarchicalrequirement") {
                    stories.push(parentRef.getRelativeUri());
                }
                else {
                    portfolioItems.push(parentRef.getRelativeUri());
                }
                this._storeInParentHash(parentRef, child);
            }
            else{
                this.leafNodes.push(child);
            }
        }, this);
        if (stories.length) {
            this._outstandingQueries++;
            this._getStories(stories);
        }

        if (portfolioItems.length) {
            this._outstandingQueries++;
            this._getPortfolioItems(portfolioItems);
        }
        if (!this._outstandingQueries) {
            debugger;
        }
    },

    _hasNotBeenRetrieved:function(ref) {
        return !this.parentHash[ref];
    },
    _getNotRetrieved:function(refs) {

        var results = [];
        Ext.each(refs,function(ref){
            if(this._hasNotBeenRetrieved(ref)){
                results.push(ref);
            }
        },this);
        return results;
    },
    _getStories:function(stories) {
        stories = this._getNotRetrieved(stories);
        var filter = Ext.create('Rally.data.QueryFilter', {
            property: 'Parent',
            value:Rally.util.Ref.getRelativeUri(stories.pop())
        });
        while (stories.length) {
            filter = filter.or({
                property: 'Parent',
                value: Rally.util.Ref.getRelativeUri(stories.pop())
            });
        }
        var store = Ext.create("Rally.data.WsapiDataStore", {
            model:"story",
            autoLoad:true,
            limit:Infinity,
            filters: filter,
            listeners:{
                load:function(store, records) {
                    this._processResults(records);
                },
                scope:this
            }
        });
    },


    _getPortfolioItems:function(portfolioItems) {

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
                    this._processResults(records);
                },
                scope:this
            }
        });
    }

});
