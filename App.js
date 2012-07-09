Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    itemId:"App",

    leafNodes :[],
    orphanNodes :[],
    parentHash:{},
    processedRefs :{},


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
        var context = this.getContext().getDataContext();
        context.project = undefined;
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
                    this._processResults(records);
                },
                scope:this
            },
            context:context
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

        var portfolioItems = [];
        var stories = [];
        Ext.each(children, function(child) {
            this.processedRefs[Rally.util.Ref.getRelativeUri(child)] = true;
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
            else {
                this.leafNodes.push(child);
            }
        }, this);


        if (portfolioItems.length) {
            this._getPortfolioItems(portfolioItems);
        }

        if (stories.length) {
            this._getStories(stories);
        }

        if (!this._outstandingQueries) {
            this._display();
        }
    },

    _hasNotBeenRetrieved:function(ref) {
        return !this.processedRefs[ref];
    },

    _getNotRetrieved:function(refs) {

        var results = [];
        Ext.each(refs, function(ref) {
            if (this._hasNotBeenRetrieved(ref)) {
                results.push(ref);
            }
        }, this);
        return results;
    },

    _getObjectIdsFromRefs:function(refs) {
        var objectIds = [];
        Ext.each(refs, function(ref) {
            objectIds.push(new Rally.util.Ref(ref).getOid());
        });
        return objectIds;
    },

    _getStories:function(stories) {
        var context = this.getContext().getDataContext();
        context.project = undefined;
        stories = this._getNotRetrieved(stories);
        if (!stories.length) {
            return;
        }
        this._outstandingQueries++;
        var objectIds = this._getObjectIdsFromRefs(stories);

        var filter = Ext.create('Rally.data.QueryFilter', {
            property: 'ObjectID',
            value:objectIds.pop()
        });
        while (objectIds.length) {
            filter = filter.or({
                property: 'ObjectID',
                value: objectIds.pop()
            });
        }

        var store = Ext.create("Rally.data.WsapiDataStore", {
            model:"story",
            autoLoad:true,
            limit:Infinity,
            filters: filter,
            context:context,
            listeners:{
                load:function(store, records) {
                    this._processResults(records);
                },
                scope:this
            }
        });
    },

    _getPortfolioItems:function(portfolioItems) {
        var context = this.getContext().getDataContext();
        context.project = undefined;
        portfolioItems = this._getNotRetrieved(portfolioItems);
        if (!portfolioItems.length) {
            return;
        }
        this._outstandingQueries++;
        var objectIds = this._getObjectIdsFromRefs(portfolioItems);

        var filter = Ext.create('Rally.data.QueryFilter', {
            property: 'ObjectID',
            value:objectIds.pop()
        });
        while (objectIds.length) {
            filter = filter.or({
                property: 'ObjectID',
                value: objectIds.pop()
            });
        }

        var store = Ext.create("Rally.data.WsapiDataStore", {
            model:"portfolioitem",
            autoLoad:true,
            limit:Infinity,
            filters: filter,
            context:context,
            listeners:{
                load:function(store, records) {
                    this._processResults(records);
                },
                scope:this
            }
        });
    },

    _display:function() {
        var currentRef;
        var depth = 0;
        Ext.each(this.leafNodes, function(record) {
            this._addOneRef(record, 0);
        }, this);
    },


    _addOneRef:function(record, depth) {
        var currentRef = Rally.util.Ref.getRelativeUri(record.get('_ref'));
        var childArray = this.parentHash[currentRef];
        var stars = "";
        while (depth) {
            stars += "*";
            depth--;
        }

        this.add({
            html:stars + "  " + record.get("Name")
        });
        if (childArray) {
            Ext.each(childArray, function(child) {
                this._addOneRef(child, depth + 1);
            }, this);
        }

    }

});
