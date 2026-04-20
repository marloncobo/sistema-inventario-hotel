import{a as Ct,b as Fe,c as Vt}from"./chunk-R2HGFI7T.js";import{a as Rt,b as Ht}from"./chunk-ERHFQSWE.js";import{a as Yt}from"./chunk-EQ6RQVMZ.js";import{b as _t}from"./chunk-LFGE3HLU.js";import{a as Ot,b as kt}from"./chunk-RMZHWUZG.js";import{a as ht}from"./chunk-RVPAF6LZ.js";import{a as vt,b as xt,c as Ue,d as zt,e as Qt,f as Kt,g as Ut,h as $t,i as Gt,j as qt,k as jt,l as Wt}from"./chunk-EBW7JBZD.js";import{a as yt,b as Et}from"./chunk-DHNM7XV6.js";import{a as Le,c as Mt,d as Be,f as ye,g as Ft,h as Qe,i as Lt,l as Bt,m as At,q as Dt,r as Ke,s as Pt,t as Ae,u as Nt,v as De}from"./chunk-MLH5EDOY.js";import{$ as ie,Aa as Ee,Ba as gt,Da as ft,Fa as Me,Ha as bt,K as ke,Ka as It,L as te,M as nt,Ma as St,N as ot,Oa as Tt,Pa as wt,Q as lt,_ as at,aa as ne,ba as fe,da as be,ea as rt,f as Oe,g as tt,ga as st,h as ge,ha as ct,i as it,j as ee,k as U,ma as pt,oa as dt,pa as ut,qa as mt,ra as G,sa as N,ta as oe,ua as se,xa as ce,ya as Ve,za as L}from"./chunk-O56QESST.js";import{$ as j,$a as H,Ab as Y,Bb as me,C as ze,Da as V,Db as $,Ea as We,Eb as m,Fb as y,Gb as M,Hb as re,Ja as Ie,Jb as Se,Kb as Te,Lb as we,Mb as Z,Nb as _e,O as xe,Oa as Q,Ob as P,P as le,Pa as de,Pb as he,Q as pe,Qb as Xe,Ra as W,S as q,Sa as ae,Ta as u,U as k,Vb as A,Z as f,Za as I,Zb as K,_ as b,_a as R,_b as et,a as Ge,ab as Ye,ac as J,b as qe,bb as Ze,cb as Je,db as r,eb as d,fb as p,ga as B,gb as E,gc as x,hc as X,kb as T,la as z,lb as w,mb as F,nb as O,pb as v,rb as s,sb as Ce,tb as ue,ub as C,vb as D,wa as je,wb as h,xb as g,ya as c}from"./chunk-OYM62HIK.js";var Zt=`
    .p-chip {
        display: inline-flex;
        align-items: center;
        background: dt('chip.background');
        color: dt('chip.color');
        border-radius: dt('chip.border.radius');
        padding-block: dt('chip.padding.y');
        padding-inline: dt('chip.padding.x');
        gap: dt('chip.gap');
    }

    .p-chip-icon {
        color: dt('chip.icon.color');
        font-size: dt('chip.icon.font.size');
        width: dt('chip.icon.size');
        height: dt('chip.icon.size');
    }

    .p-chip-image {
        border-radius: 50%;
        width: dt('chip.image.width');
        height: dt('chip.image.height');
        margin-inline-start: calc(-1 * dt('chip.padding.y'));
    }

    .p-chip:has(.p-chip-remove-icon) {
        padding-inline-end: dt('chip.padding.y');
    }

    .p-chip:has(.p-chip-image) {
        padding-block-start: calc(dt('chip.padding.y') / 2);
        padding-block-end: calc(dt('chip.padding.y') / 2);
    }

    .p-chip-remove-icon {
        cursor: pointer;
        font-size: dt('chip.remove.icon.size');
        width: dt('chip.remove.icon.size');
        height: dt('chip.remove.icon.size');
        color: dt('chip.remove.icon.color');
        border-radius: 50%;
        transition:
            outline-color dt('chip.transition.duration'),
            box-shadow dt('chip.transition.duration');
        outline-color: transparent;
    }

    .p-chip-remove-icon:focus-visible {
        box-shadow: dt('chip.remove.icon.focus.ring.shadow');
        outline: dt('chip.remove.icon.focus.ring.width') dt('chip.remove.icon.focus.ring.style') dt('chip.remove.icon.focus.ring.color');
        outline-offset: dt('chip.remove.icon.focus.ring.offset');
    }
`;var hi=["removeicon"],gi=["*"];function fi(t,l){if(t&1){let e=O();d(0,"img",4),v("error",function(i){f(e);let o=s();return b(o.imageError(i))}),p()}if(t&2){let e=s();m(e.cx("image")),r("pBind",e.ptm("image"))("src",e.image,je)("alt",e.alt)}}function bi(t,l){if(t&1&&E(0,"span",6),t&2){let e=s(2);m(e.icon),r("pBind",e.ptm("icon"))("ngClass",e.cx("icon"))}}function yi(t,l){if(t&1&&u(0,bi,1,4,"span",5),t&2){let e=s();r("ngIf",e.icon)}}function vi(t,l){if(t&1&&(d(0,"div",7),y(1),p()),t&2){let e=s();m(e.cx("label")),r("pBind",e.ptm("label")),c(),M(e.label)}}function xi(t,l){if(t&1){let e=O();d(0,"span",11),v("click",function(i){f(e);let o=s(3);return b(o.close(i))})("keydown",function(i){f(e);let o=s(3);return b(o.onKeydown(i))}),p()}if(t&2){let e=s(3);m(e.removeIcon),r("pBind",e.ptm("removeIcon"))("ngClass",e.cx("removeIcon")),I("tabindex",e.disabled?-1:0)("aria-label",e.removeAriaLabel)}}function Ii(t,l){if(t&1){let e=O();j(),d(0,"svg",12),v("click",function(i){f(e);let o=s(3);return b(o.close(i))})("keydown",function(i){f(e);let o=s(3);return b(o.onKeydown(i))}),p()}if(t&2){let e=s(3);m(e.cx("removeIcon")),r("pBind",e.ptm("removeIcon")),I("tabindex",e.disabled?-1:0)("aria-label",e.removeAriaLabel)}}function Ci(t,l){if(t&1&&(T(0),u(1,xi,1,6,"span",9)(2,Ii,1,5,"svg",10),w()),t&2){let e=s(2);c(),r("ngIf",e.removeIcon),c(),r("ngIf",!e.removeIcon)}}function Si(t,l){}function Ti(t,l){t&1&&u(0,Si,0,0,"ng-template")}function wi(t,l){if(t&1){let e=O();d(0,"span",13),v("click",function(i){f(e);let o=s(2);return b(o.close(i))})("keydown",function(i){f(e);let o=s(2);return b(o.onKeydown(i))}),u(1,Ti,1,0,null,14),p()}if(t&2){let e=s(2);m(e.cx("removeIcon")),r("pBind",e.ptm("removeIcon")),I("tabindex",e.disabled?-1:0)("aria-label",e.removeAriaLabel),c(),r("ngTemplateOutlet",e.removeIconTemplate||e._removeIconTemplate)}}function Oi(t,l){if(t&1&&(T(0),u(1,Ci,3,2,"ng-container",3)(2,wi,2,6,"span",8),w()),t&2){let e=s();c(),r("ngIf",!e.removeIconTemplate&&!e._removeIconTemplate),c(),r("ngIf",e.removeIconTemplate||e._removeIconTemplate)}}var ki={root:({instance:t})=>["p-chip p-component",{"p-disabled":t.disabled}],image:"p-chip-image",icon:"p-chip-icon",label:"p-chip-label",removeIcon:"p-chip-remove-icon"},Jt=(()=>{class t extends se{name="chip";style=Zt;classes=ki;static \u0275fac=(()=>{let e;return function(i){return(e||(e=z(t)))(i||t)}})();static \u0275prov=le({token:t,factory:t.\u0275fac})}return t})();var Xt=new q("CHIP_INSTANCE"),ii=(()=>{class t extends Ve{$pcChip=k(Xt,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=k(L,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}label;icon;image;alt;styleClass;disabled=!1;removable=!1;removeIcon;onRemove=new V;onImageError=new V;visible=!0;get removeAriaLabel(){return this.config.getTranslation(oe.ARIA).removeLabel}get chipProps(){return this._chipProps}set chipProps(e){this._chipProps=e,e&&typeof e=="object"&&Object.entries(e).forEach(([n,i])=>this[`_${n}`]!==i&&(this[`_${n}`]=i))}_chipProps;_componentStyle=k(Jt);removeIconTemplate;templates;_removeIconTemplate;onAfterContentInit(){this.templates.forEach(e=>{e.getType()==="removeicon"?this._removeIconTemplate=e.template:this._removeIconTemplate=e.template})}onChanges(e){if(e.chipProps&&e.chipProps.currentValue){let{currentValue:n}=e.chipProps;n.label!==void 0&&(this.label=n.label),n.icon!==void 0&&(this.icon=n.icon),n.image!==void 0&&(this.image=n.image),n.alt!==void 0&&(this.alt=n.alt),n.styleClass!==void 0&&(this.styleClass=n.styleClass),n.removable!==void 0&&(this.removable=n.removable),n.removeIcon!==void 0&&(this.removeIcon=n.removeIcon)}}close(e){this.visible=!1,this.onRemove.emit(e)}onKeydown(e){(e.key==="Enter"||e.key==="Backspace")&&this.close(e)}imageError(e){this.onImageError.emit(e)}static \u0275fac=(()=>{let e;return function(i){return(e||(e=z(t)))(i||t)}})();static \u0275cmp=Q({type:t,selectors:[["p-chip"]],contentQueries:function(n,i,o){if(n&1&&(C(o,hi,4),C(o,G,4)),n&2){let a;h(a=g())&&(i.removeIconTemplate=a.first),h(a=g())&&(i.templates=a)}},hostVars:5,hostBindings:function(n,i){n&2&&(I("aria-label",i.label),m(i.cn(i.cx("root"),i.styleClass)),me("display",!i.visible&&"none"))},inputs:{label:"label",icon:"icon",image:"image",alt:"alt",styleClass:"styleClass",disabled:[2,"disabled","disabled",x],removable:[2,"removable","removable",x],removeIcon:"removeIcon",chipProps:"chipProps"},outputs:{onRemove:"onRemove",onImageError:"onImageError"},features:[Z([Jt,{provide:Xt,useExisting:t},{provide:ce,useExisting:t}]),ae([L]),W],ngContentSelectors:gi,decls:6,vars:4,consts:[["iconTemplate",""],[3,"pBind","class","src","alt","error",4,"ngIf","ngIfElse"],[3,"pBind","class",4,"ngIf"],[4,"ngIf"],[3,"error","pBind","src","alt"],[3,"pBind","class","ngClass",4,"ngIf"],[3,"pBind","ngClass"],[3,"pBind"],["role","button",3,"pBind","class","click","keydown",4,"ngIf"],["role","button",3,"pBind","class","ngClass","click","keydown",4,"ngIf"],["data-p-icon","times-circle","role","button",3,"pBind","class","click","keydown",4,"ngIf"],["role","button",3,"click","keydown","pBind","ngClass"],["data-p-icon","times-circle","role","button",3,"click","keydown","pBind"],["role","button",3,"click","keydown","pBind"],[4,"ngTemplateOutlet"]],template:function(n,i){if(n&1&&(Ce(),ue(0),u(1,fi,1,5,"img",1)(2,yi,1,1,"ng-template",null,0,A)(4,vi,2,4,"div",2)(5,Oi,3,2,"ng-container",3)),n&2){let o=Y(3);c(),r("ngIf",i.image)("ngIfElse",o),c(3),r("ngIf",i.label),c(),r("ngIf",i.removable)}},dependencies:[U,Oe,ge,ee,Ct,N,L],encapsulation:2,changeDetection:0})}return t})();var ni=`
    .p-multiselect {
        display: inline-flex;
        cursor: pointer;
        position: relative;
        user-select: none;
        background: dt('multiselect.background');
        border: 1px solid dt('multiselect.border.color');
        transition:
            background dt('multiselect.transition.duration'),
            color dt('multiselect.transition.duration'),
            border-color dt('multiselect.transition.duration'),
            outline-color dt('multiselect.transition.duration'),
            box-shadow dt('multiselect.transition.duration');
        border-radius: dt('multiselect.border.radius');
        outline-color: transparent;
        box-shadow: dt('multiselect.shadow');
    }

    .p-multiselect:not(.p-disabled):hover {
        border-color: dt('multiselect.hover.border.color');
    }

    .p-multiselect:not(.p-disabled).p-focus {
        border-color: dt('multiselect.focus.border.color');
        box-shadow: dt('multiselect.focus.ring.shadow');
        outline: dt('multiselect.focus.ring.width') dt('multiselect.focus.ring.style') dt('multiselect.focus.ring.color');
        outline-offset: dt('multiselect.focus.ring.offset');
    }

    .p-multiselect.p-variant-filled {
        background: dt('multiselect.filled.background');
    }

    .p-multiselect.p-variant-filled:not(.p-disabled):hover {
        background: dt('multiselect.filled.hover.background');
    }

    .p-multiselect.p-variant-filled.p-focus {
        background: dt('multiselect.filled.focus.background');
    }

    .p-multiselect.p-invalid {
        border-color: dt('multiselect.invalid.border.color');
    }

    .p-multiselect.p-disabled {
        opacity: 1;
        background: dt('multiselect.disabled.background');
    }

    .p-multiselect-dropdown {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: transparent;
        color: dt('multiselect.dropdown.color');
        width: dt('multiselect.dropdown.width');
        border-start-end-radius: dt('multiselect.border.radius');
        border-end-end-radius: dt('multiselect.border.radius');
    }

    .p-multiselect-clear-icon {
        align-self: center;
        color: dt('multiselect.clear.icon.color');
        inset-inline-end: dt('multiselect.dropdown.width');
    }

    .p-multiselect-label-container {
        overflow: hidden;
        flex: 1 1 auto;
        cursor: pointer;
    }

    .p-multiselect-label {
        white-space: nowrap;
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: dt('multiselect.padding.y') dt('multiselect.padding.x');
        color: dt('multiselect.color');
    }

    .p-multiselect-display-chip .p-multiselect-label {
        display: flex;
        align-items: center;
        gap: calc(dt('multiselect.padding.y') / 2);
    }

    .p-multiselect-label.p-placeholder {
        color: dt('multiselect.placeholder.color');
    }

    .p-multiselect.p-invalid .p-multiselect-label.p-placeholder {
        color: dt('multiselect.invalid.placeholder.color');
    }

    .p-multiselect.p-disabled .p-multiselect-label {
        color: dt('multiselect.disabled.color');
    }

    .p-multiselect-label-empty {
        overflow: hidden;
        visibility: hidden;
    }

    .p-multiselect-overlay {
        position: absolute;
        top: 0;
        left: 0;
        background: dt('multiselect.overlay.background');
        color: dt('multiselect.overlay.color');
        border: 1px solid dt('multiselect.overlay.border.color');
        border-radius: dt('multiselect.overlay.border.radius');
        box-shadow: dt('multiselect.overlay.shadow');
        min-width: 100%;
    }

    .p-multiselect-header {
        display: flex;
        align-items: center;
        padding: dt('multiselect.list.header.padding');
    }

    .p-multiselect-header .p-checkbox {
        margin-inline-end: dt('multiselect.option.gap');
    }

    .p-multiselect-filter-container {
        flex: 1 1 auto;
    }

    .p-multiselect-filter {
        width: 100%;
    }

    .p-multiselect-list-container {
        overflow: auto;
    }

    .p-multiselect-list {
        margin: 0;
        padding: 0;
        list-style-type: none;
        padding: dt('multiselect.list.padding');
        display: flex;
        flex-direction: column;
        gap: dt('multiselect.list.gap');
    }

    .p-multiselect-option {
        cursor: pointer;
        font-weight: normal;
        white-space: nowrap;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: dt('multiselect.option.gap');
        padding: dt('multiselect.option.padding');
        border: 0 none;
        color: dt('multiselect.option.color');
        background: transparent;
        transition:
            background dt('multiselect.transition.duration'),
            color dt('multiselect.transition.duration'),
            border-color dt('multiselect.transition.duration'),
            box-shadow dt('multiselect.transition.duration'),
            outline-color dt('multiselect.transition.duration');
        border-radius: dt('multiselect.option.border.radius');
    }

    .p-multiselect-option:not(.p-multiselect-option-selected):not(.p-disabled).p-focus {
        background: dt('multiselect.option.focus.background');
        color: dt('multiselect.option.focus.color');
    }

    .p-multiselect-option.p-multiselect-option-selected {
        background: dt('multiselect.option.selected.background');
        color: dt('multiselect.option.selected.color');
    }

    .p-multiselect-option.p-multiselect-option-selected.p-focus {
        background: dt('multiselect.option.selected.focus.background');
        color: dt('multiselect.option.selected.focus.color');
    }

    .p-multiselect-option-group {
        cursor: auto;
        margin: 0;
        padding: dt('multiselect.option.group.padding');
        background: dt('multiselect.option.group.background');
        color: dt('multiselect.option.group.color');
        font-weight: dt('multiselect.option.group.font.weight');
    }

    .p-multiselect-empty-message {
        padding: dt('multiselect.empty.message.padding');
    }

    .p-multiselect-label .p-chip {
        padding-block-start: calc(dt('multiselect.padding.y') / 2);
        padding-block-end: calc(dt('multiselect.padding.y') / 2);
        border-radius: dt('multiselect.chip.border.radius');
    }

    .p-multiselect-label:has(.p-chip) {
        padding: calc(dt('multiselect.padding.y') / 2) calc(dt('multiselect.padding.x') / 2);
    }

    .p-multiselect-fluid {
        display: flex;
        width: 100%;
    }

    .p-multiselect-sm .p-multiselect-label {
        font-size: dt('multiselect.sm.font.size');
        padding-block: dt('multiselect.sm.padding.y');
        padding-inline: dt('multiselect.sm.padding.x');
    }

    .p-multiselect-sm .p-multiselect-dropdown .p-icon {
        font-size: dt('multiselect.sm.font.size');
        width: dt('multiselect.sm.font.size');
        height: dt('multiselect.sm.font.size');
    }

    .p-multiselect-lg .p-multiselect-label {
        font-size: dt('multiselect.lg.font.size');
        padding-block: dt('multiselect.lg.padding.y');
        padding-inline: dt('multiselect.lg.padding.x');
    }

    .p-multiselect-lg .p-multiselect-dropdown .p-icon {
        font-size: dt('multiselect.lg.font.size');
        width: dt('multiselect.lg.font.size');
        height: dt('multiselect.lg.font.size');
    }

    .p-floatlabel-in .p-multiselect-filter {
        padding-block-start: dt('multiselect.padding.y');
        padding-block-end: dt('multiselect.padding.y');
    }
`;var Mi=["pMultiSelectItem",""],li=t=>({$implicit:t}),Fi=(t,l)=>({checked:t,class:l});function Li(t,l){}function Bi(t,l){t&1&&u(0,Li,0,0,"ng-template")}function Ai(t,l){if(t&1&&u(0,Bi,1,0,null,3),t&2){let e=l.class,n=s(2);r("ngTemplateOutlet",n.itemCheckboxIconTemplate)("ngTemplateOutletContext",he(2,Fi,n.selected,e))}}function Di(t,l){t&1&&(T(0),u(1,Ai,1,5,"ng-template",null,0,A),w())}function Pi(t,l){if(t&1&&(d(0,"span"),y(1),p()),t&2){let e=s();c(),M(e.label??"empty")}}function Ni(t,l){t&1&&F(0)}var Ri=["item"],Hi=["group"],zi=["loader"],Qi=["header"],Ki=["filter"],Ui=["footer"],$i=["emptyfilter"],Gi=["empty"],qi=["selecteditems"],ji=["loadingicon"],Wi=["filtericon"],Yi=["removetokenicon"],Zi=["chipicon"],Ji=["clearicon"],Xi=["dropdownicon"],en=["itemcheckboxicon"],tn=["headercheckboxicon"],nn=["overlay"],on=["filterInput"],ln=["focusInput"],an=["items"],rn=["scroller"],sn=["lastHiddenFocusableEl"],cn=["firstHiddenFocusableEl"],pn=["headerCheckbox"],dn=[[["p-header"]],[["p-footer"]]],un=["p-header","p-footer"],mn=()=>({class:"p-multiselect-chip-icon"}),_n=(t,l)=>({$implicit:t,removeChip:l}),ai=t=>({options:t}),hn=(t,l,e)=>({checked:t,partialSelected:l,class:e}),Ne=t=>({height:t}),ri=(t,l)=>({$implicit:t,options:l}),gn=()=>({});function fn(t,l){if(t&1&&(T(0),y(1),w()),t&2){let e=s(2);c(),M(e.label()||"empty")}}function bn(t,l){if(t&1&&y(0),t&2){let e=s(3);re(" ",e.getSelectedItemsLabel()," ")}}function yn(t,l){t&1&&F(0)}function vn(t,l){if(t&1){let e=O();d(0,"span",27),v("click",function(i){f(e);let o=s(4).$implicit,a=s(4);return b(a.removeOption(o,i))}),u(1,yn,1,0,"ng-container",28),p()}if(t&2){let e=s(8);m(e.cx("chipIcon")),r("pBind",e.ptm("chipIcon")),I("aria-hidden",!0),c(),r("ngTemplateOutlet",e.chipIconTemplate||e._chipIconTemplate||e.removeTokenIconTemplate||e._removeTokenIconTemplate)("ngTemplateOutletContext",_e(6,mn))}}function xn(t,l){if(t&1&&(T(0),u(1,vn,2,7,"span",26),w()),t&2){let e=s(7);c(),r("ngIf",e.chipIconTemplate||e._chipIconTemplate||e.removeTokenIconTemplate||e._removeTokenIconTemplate)}}function In(t,l){if(t&1&&u(0,xn,2,1,"ng-container",20),t&2){let e=s(6);r("ngIf",!e.$disabled()&&!e.readonly)}}function Cn(t,l){t&1&&(T(0),u(1,In,1,1,"ng-template",null,5,A),w())}function Sn(t,l){if(t&1){let e=O();d(0,"div",19,4)(2,"p-chip",25),v("onRemove",function(i){let o=f(e).$implicit,a=s(4);return b(a.removeOption(o,i))}),u(3,Cn,3,0,"ng-container",20),p()()}if(t&2){let e=l.$implicit,n=s(4);m(n.cx("chipItem")),r("pBind",n.ptm("chipItem")),c(2),m(n.cx("pcChip")),r("pt",n.ptm("pcChip"))("label",n.getLabelByValue(e))("removable",!n.$disabled()&&!n.readonly)("removeIcon",n.chipIcon),c(),r("ngIf",n.chipIconTemplate||n._chipIconTemplate||n.removeTokenIconTemplate||n._removeTokenIconTemplate)}}function Tn(t,l){if(t&1&&u(0,Sn,4,10,"div",24),t&2){let e=s(3);r("ngForOf",e.chipSelectedItems())}}function wn(t,l){if(t&1&&(T(0),y(1),w()),t&2){let e=s(3);c(),M(e.placeholder()||"empty")}}function On(t,l){if(t&1&&(T(0),R(1,bn,1,1)(2,Tn,1,1,"div",23),u(3,wn,2,1,"ng-container",20),w()),t&2){let e=s(2);c(),H(e.chipSelectedItems()&&e.chipSelectedItems().length===e.maxSelectedLabels?1:2),c(2),r("ngIf",!e.modelValue()||e.modelValue().length===0)}}function kn(t,l){if(t&1&&(T(0),u(1,fn,2,1,"ng-container",20)(2,On,4,2,"ng-container",20),w()),t&2){let e=s();c(),r("ngIf",e.display==="comma"),c(),r("ngIf",e.display==="chip")}}function Vn(t,l){t&1&&F(0)}function En(t,l){if(t&1&&(T(0),y(1),w()),t&2){let e=s(2);c(),M(e.placeholder()||"empty")}}function Mn(t,l){if(t&1&&(T(0),u(1,Vn,1,0,"ng-container",28)(2,En,2,1,"ng-container",20),w()),t&2){let e=s();c(),r("ngTemplateOutlet",e.selectedItemsTemplate||e._selectedItemsTemplate)("ngTemplateOutletContext",he(3,_n,e.selectedOptions,e.removeOption.bind(e))),c(),r("ngIf",!e.modelValue()||e.modelValue().length===0)}}function Fn(t,l){if(t&1){let e=O();j(),d(0,"svg",31),v("click",function(i){f(e);let o=s(2);return b(o.clear(i))}),p()}if(t&2){let e=s(2);m(e.cx("clearIcon")),r("pBind",e.ptm("clearIcon")),I("aria-hidden",!0)}}function Ln(t,l){}function Bn(t,l){t&1&&u(0,Ln,0,0,"ng-template")}function An(t,l){if(t&1){let e=O();d(0,"span",27),v("click",function(i){f(e);let o=s(2);return b(o.clear(i))}),u(1,Bn,1,0,null,32),p()}if(t&2){let e=s(2);m(e.cx("clearIcon")),r("pBind",e.ptm("clearIcon")),I("aria-hidden",!0),c(),r("ngTemplateOutlet",e.clearIconTemplate||e._clearIconTemplate)}}function Dn(t,l){if(t&1&&(T(0),u(1,Fn,1,4,"svg",29)(2,An,2,5,"span",30),w()),t&2){let e=s();c(),r("ngIf",!e.clearIconTemplate&&!e._clearIconTemplate),c(),r("ngIf",e.clearIconTemplate||e._clearIconTemplate)}}function Pn(t,l){t&1&&F(0)}function Nn(t,l){if(t&1&&(T(0),u(1,Pn,1,0,"ng-container",32),w()),t&2){let e=s(2);c(),r("ngTemplateOutlet",e.loadingIconTemplate||e._loadingIconTemplate)}}function Rn(t,l){if(t&1&&E(0,"span",19),t&2){let e=s(3);m(e.cn(e.cx("loadingIcon"),"pi-spin "+e.loadingIcon)),r("pBind",e.ptm("loadingIcon")),I("aria-hidden",!0)}}function Hn(t,l){if(t&1&&E(0,"span",19),t&2){let e=s(3);m(e.cn(e.cx("loadingIcon"),"pi pi-spinner pi-spin")),r("pBind",e.ptm("loadingIcon")),I("aria-hidden",!0)}}function zn(t,l){if(t&1&&(T(0),u(1,Rn,1,4,"span",33)(2,Hn,1,4,"span",33),w()),t&2){let e=s(2);c(),r("ngIf",e.loadingIcon),c(),r("ngIf",!e.loadingIcon)}}function Qn(t,l){if(t&1&&(T(0),u(1,Nn,2,1,"ng-container",20)(2,zn,3,2,"ng-container",20),w()),t&2){let e=s();c(),r("ngIf",e.loadingIconTemplate||e._loadingIconTemplate),c(),r("ngIf",!e.loadingIconTemplate&&!e._loadingIconTemplate)}}function Kn(t,l){if(t&1&&E(0,"span",36),t&2){let e=s(3);m(e.cx("dropdownIcon")),r("pBind",e.ptm("dropdownIcon"))("ngClass",e.dropdownIcon),I("aria-hidden",!0)}}function Un(t,l){if(t&1&&(j(),E(0,"svg",37)),t&2){let e=s(3);m(e.cx("dropdownIcon")),r("pBind",e.ptm("dropdownIcon")),I("aria-hidden",!0)}}function $n(t,l){if(t&1&&(T(0),u(1,Kn,1,5,"span",34)(2,Un,1,4,"svg",35),w()),t&2){let e=s(2);c(),r("ngIf",e.dropdownIcon),c(),r("ngIf",!e.dropdownIcon)}}function Gn(t,l){}function qn(t,l){t&1&&u(0,Gn,0,0,"ng-template")}function jn(t,l){if(t&1&&(d(0,"span",19),u(1,qn,1,0,null,32),p()),t&2){let e=s(2);m(e.cx("dropdownIcon")),r("pBind",e.ptm("dropdownIcon")),I("aria-hidden",!0),c(),r("ngTemplateOutlet",e.dropdownIconTemplate||e._dropdownIconTemplate)}}function Wn(t,l){if(t&1&&u(0,$n,3,2,"ng-container",20)(1,jn,2,5,"span",33),t&2){let e=s();r("ngIf",!e.dropdownIconTemplate&&!e._dropdownIconTemplate),c(),r("ngIf",e.dropdownIconTemplate||e._dropdownIconTemplate)}}function Yn(t,l){t&1&&F(0)}function Zn(t,l){t&1&&F(0)}function Jn(t,l){if(t&1&&(T(0),u(1,Zn,1,0,"ng-container",28),w()),t&2){let e=s(3);c(),r("ngTemplateOutlet",e.filterTemplate||e._filterTemplate)("ngTemplateOutletContext",P(2,ai,e.filterOptions))}}function Xn(t,l){if(t&1&&(j(),E(0,"svg",45)),t&2){let e=s().class,n=s(5);m(e),r("pBind",n.getHeaderCheckboxPTOptions("pcHeaderCheckbox.icon"))}}function eo(t,l){}function to(t,l){t&1&&u(0,eo,0,0,"ng-template")}function io(t,l){if(t&1&&u(0,Xn,1,3,"svg",44)(1,to,1,0,null,28),t&2){let e=l.class,n=s(5);r("ngIf",!n.headerCheckboxIconTemplate&&!n._headerCheckboxIconTemplate&&n.allSelected()),c(),r("ngTemplateOutlet",n.headerCheckboxIconTemplate||n._headerCheckboxIconTemplate)("ngTemplateOutletContext",Xe(3,hn,n.allSelected(),n.partialSelected(),e))}}function no(t,l){if(t&1){let e=O();d(0,"p-checkbox",43,10),v("onChange",function(i){f(e);let o=s(4);return b(o.onToggleAll(i))}),u(2,io,2,7,"ng-template",null,11,A),p()}if(t&2){let e=s(4);r("pt",e.getHeaderCheckboxPTOptions("pcHeaderCheckbox"))("ngModel",e.allSelected())("ariaLabel",e.toggleAllAriaLabel)("binary",!0)("variant",e.$variant())("disabled",e.$disabled())}}function oo(t,l){if(t&1&&(j(),E(0,"svg",50)),t&2){let e=s(5);r("pBind",e.ptm("filterIcon"))}}function lo(t,l){}function ao(t,l){t&1&&u(0,lo,0,0,"ng-template")}function ro(t,l){if(t&1&&(d(0,"span",51),u(1,ao,1,0,null,32),p()),t&2){let e=s(5);r("pBind",e.ptm("filterIcon")),c(),r("ngTemplateOutlet",e.filterIconTemplate||e._filterIconTemplate)}}function so(t,l){if(t&1){let e=O();d(0,"p-iconfield",46)(1,"input",47,12),v("input",function(i){f(e);let o=s(4);return b(o.onFilterInputChange(i))})("keydown",function(i){f(e);let o=s(4);return b(o.onFilterKeyDown(i))})("click",function(i){f(e);let o=s(4);return b(o.onInputClick(i))})("blur",function(i){f(e);let o=s(4);return b(o.onFilterBlur(i))}),p(),d(3,"p-inputicon",46),u(4,oo,1,1,"svg",48)(5,ro,2,2,"span",49),p()()}if(t&2){let e=s(4);m(e.cx("pcFilterContainer")),r("pt",e.ptm("pcFilterContainer")),c(),m(e.cx("pcFilter")),r("pt",e.ptm("pcFilter"))("variant",e.$variant())("value",e._filterValue()||""),I("autocomplete",e.autocomplete)("aria-owns",e.id+"_list")("aria-activedescendant",e.focusedOptionId)("disabled",e.$disabled()?"":void 0)("placeholder",e.filterPlaceHolder)("aria-label",e.ariaFilterLabel),c(2),r("pt",e.ptm("pcFilterIconContainer")),c(),r("ngIf",!e.filterIconTemplate&&!e._filterIconTemplate),c(),r("ngIf",e.filterIconTemplate||e._filterIconTemplate)}}function co(t,l){if(t&1&&u(0,no,4,6,"p-checkbox",41)(1,so,6,17,"p-iconfield",42),t&2){let e=s(3);r("ngIf",e.showToggleAll&&!e.selectionLimit),c(),r("ngIf",e.filter)}}function po(t,l){if(t&1&&(d(0,"div",19),ue(1),u(2,Jn,2,4,"ng-container",21)(3,co,2,2,"ng-template",null,9,A),p()),t&2){let e=Y(4),n=s(2);m(n.cx("header")),r("pBind",n.ptm("header")),c(2),r("ngIf",n.filterTemplate||n._filterTemplate)("ngIfElse",e)}}function uo(t,l){t&1&&F(0)}function mo(t,l){if(t&1&&u(0,uo,1,0,"ng-container",28),t&2){let e=l.$implicit,n=l.options;s(2);let i=Y(9);r("ngTemplateOutlet",i)("ngTemplateOutletContext",he(2,ri,e,n))}}function _o(t,l){t&1&&F(0)}function ho(t,l){if(t&1&&u(0,_o,1,0,"ng-container",28),t&2){let e=l.options,n=s(4);r("ngTemplateOutlet",n.loaderTemplate||n._loaderTemplate)("ngTemplateOutletContext",P(2,ai,e))}}function go(t,l){t&1&&(T(0),u(1,ho,1,4,"ng-template",null,14,A),w())}function fo(t,l){if(t&1){let e=O();d(0,"p-scroller",52,13),v("onLazyLoad",function(i){f(e);let o=s(2);return b(o.onLazyLoad.emit(i))}),u(2,mo,1,5,"ng-template",null,3,A)(4,go,3,0,"ng-container",20),p()}if(t&2){let e=s(2);$(P(9,Ne,e.scrollHeight)),r("items",e.visibleOptions())("itemSize",e.virtualScrollItemSize)("autoSize",!0)("tabindex",-1)("lazy",e.lazy)("options",e.virtualScrollOptions),c(4),r("ngIf",e.loaderTemplate||e._loaderTemplate)}}function bo(t,l){t&1&&F(0)}function yo(t,l){if(t&1&&(T(0),u(1,bo,1,0,"ng-container",28),w()),t&2){s();let e=Y(9),n=s();c(),r("ngTemplateOutlet",e)("ngTemplateOutletContext",he(3,ri,n.visibleOptions(),_e(2,gn)))}}function vo(t,l){if(t&1&&(d(0,"span"),y(1),p()),t&2){let e=s(2).$implicit,n=s(3);c(),M(n.getOptionGroupLabel(e.optionGroup))}}function xo(t,l){if(t&1&&F(0,58),t&2){let e=s(2).$implicit,n=s(3);r("ngTemplateOutlet",n.groupTemplate)("ngTemplateOutletContext",P(2,li,e.optionGroup))}}function Io(t,l){if(t&1&&(T(0),d(1,"li",56),u(2,vo,2,1,"span",20)(3,xo,1,4,"ng-container",57),p(),w()),t&2){let e=s(),n=e.$implicit,i=e.index,o=s().options,a=s(2);c(),m(a.cx("optionGroup")),r("pBind",a.ptm("optionGroup"))("ngStyle",P(7,Ne,o.itemSize+"px")),I("id",a.id+"_"+a.getOptionIndex(i,o)),c(),r("ngIf",!a.groupTemplate&&n.optionGroup),c(),r("ngIf",n.optionGroup&&a.groupTemplate)}}function Co(t,l){if(t&1){let e=O();T(0),d(1,"li",59),v("onClick",function(i){f(e);let o=s().index,a=s().options,_=s(2);return b(_.onOptionSelect(i,!1,_.getOptionIndex(o,a)))})("onMouseEnter",function(i){f(e);let o=s().index,a=s().options,_=s(2);return b(_.onOptionMouseEnter(i,_.getOptionIndex(o,a)))}),p(),w()}if(t&2){let e=s(),n=e.$implicit,i=e.index,o=s().options,a=s(2);c(),r("pBind",a.getPTOptions(n,a.getItemOptions,i,"option"))("id",a.id+"_"+a.getOptionIndex(i,o))("option",n)("selected",a.isSelected(n))("label",a.getOptionLabel(n))("disabled",a.isOptionDisabled(n))("template",a.itemTemplate||a._itemTemplate)("itemCheckboxIconTemplate",a.itemCheckboxIconTemplate||a._itemCheckboxIconTemplate)("itemSize",o.itemSize)("focused",a.focusedOptionIndex()===a.getOptionIndex(i,o))("ariaPosInset",a.getAriaPosInset(a.getOptionIndex(i,o)))("ariaSetSize",a.ariaSetSize)("variant",a.$variant())("highlightOnSelect",a.highlightOnSelect)("pt",a.pt)}}function So(t,l){if(t&1&&u(0,Io,4,9,"ng-container",20)(1,Co,2,15,"ng-container",20),t&2){let e=l.$implicit,n=s(3);r("ngIf",n.isOptionGroup(e)),c(),r("ngIf",!n.isOptionGroup(e))}}function To(t,l){if(t&1&&y(0),t&2){let e=s(4);re(" ",e.emptyFilterMessageLabel," ")}}function wo(t,l){t&1&&F(0)}function Oo(t,l){if(t&1&&u(0,wo,1,0,"ng-container",32),t&2){let e=s(4);r("ngTemplateOutlet",e.emptyFilterTemplate||e._emptyFilterTemplate||e.emptyTemplate||e._emptyFilterTemplate)}}function ko(t,l){if(t&1&&(d(0,"li",56),R(1,To,1,1)(2,Oo,1,1,"ng-container"),p()),t&2){let e=s().options,n=s(2);m(n.cx("emptyMessage")),r("pBind",n.ptm("emptyMessage"))("ngStyle",P(5,Ne,e.itemSize+"px")),c(),H(!n.emptyFilterTemplate&&!n._emptyFilterTemplate&&!n.emptyTemplate&&!n._emptyTemplate?1:2)}}function Vo(t,l){if(t&1&&y(0),t&2){let e=s(4);re(" ",e.emptyMessageLabel," ")}}function Eo(t,l){t&1&&F(0)}function Mo(t,l){if(t&1&&u(0,Eo,1,0,"ng-container",32),t&2){let e=s(4);r("ngTemplateOutlet",e.emptyTemplate||e._emptyTemplate)}}function Fo(t,l){if(t&1&&(d(0,"li",56),R(1,Vo,1,1)(2,Mo,1,1,"ng-container"),p()),t&2){let e=s().options,n=s(2);m(n.cx("emptyMessage")),r("pBind",n.ptm("emptyMessage"))("ngStyle",P(5,Ne,e.itemSize+"px")),c(),H(!n.emptyTemplate&&!n._emptyTemplate?1:2)}}function Lo(t,l){if(t&1&&(d(0,"ul",53,15),u(2,So,2,2,"ng-template",54)(3,ko,3,7,"li",55)(4,Fo,3,7,"li",55),p()),t&2){let e=l.$implicit,n=l.options,i=s(2);$(n.contentStyle),m(i.cn(i.cx("list"),n.contentStyleClass)),r("pBind",i.ptm("list")),I("aria-label",i.listLabel),c(2),r("ngForOf",e),c(),r("ngIf",i.hasFilter()&&i.isEmpty()),c(),r("ngIf",!i.hasFilter()&&i.isEmpty())}}function Bo(t,l){t&1&&F(0)}function Ao(t,l){if(t&1&&(d(0,"div"),ue(1,1),u(2,Bo,1,0,"ng-container",32),p()),t&2){let e=s(2);c(2),r("ngTemplateOutlet",e.footerTemplate||e._footerTemplate)}}function Do(t,l){if(t&1){let e=O();d(0,"div",38)(1,"span",39,6),v("focus",function(i){f(e);let o=s();return b(o.onFirstHiddenFocus(i))}),p(),u(3,Yn,1,0,"ng-container",32)(4,po,5,5,"div",33),d(5,"div",19),u(6,fo,5,11,"p-scroller",40)(7,yo,2,6,"ng-container",20)(8,Lo,5,9,"ng-template",null,7,A),p(),u(10,Ao,3,1,"div",20),d(11,"span",39,8),v("focus",function(i){f(e);let o=s();return b(o.onLastHiddenFocus(i))}),p()()}if(t&2){let e=s();m(e.cn(e.cx("overlay"),e.panelStyleClass)),r("pBind",e.ptm("overlay"))("ngStyle",e.panelStyle),I("id",e.id+"_list"),c(),r("pBind",e.ptm("firstHiddenFocusableEl")),I("tabindex",0)("data-p-hidden-accessible",!0)("data-p-hidden-focusable",!0),c(2),r("ngTemplateOutlet",e.headerTemplate||e._headerTemplate),c(),r("ngIf",e.showHeader),c(),m(e.cx("listContainer")),me("max-height",e.virtualScroll?"auto":e.scrollHeight||"auto"),r("pBind",e.ptm("listContainer")),c(),r("ngIf",e.virtualScroll),c(),r("ngIf",!e.virtualScroll),c(3),r("ngIf",e.footerFacet||e.footerTemplate||e._footerTemplate),c(),r("pBind",e.ptm("lastHiddenFocusableEl")),I("tabindex",0)("data-p-hidden-accessible",!0)("data-p-hidden-focusable",!0)}}var Po=`
    ${ni}

    /* For PrimeNG */
   .p-multiselect.ng-invalid.ng-dirty {
        border-color: dt('multiselect.invalid.border.color');
    }
    p-multiSelect.ng-invalid.ng-dirty .p-multiselect-label.p-placeholder,
    p-multi-select.ng-invalid.ng-dirty .p-multiselect-label.p-placeholder,
    p-multiselect.ng-invalid.ng-dirty .p-multiselect-label.p-placeholder {
        color: dt('multiselect.invalid.placeholder.color');
    }
`,No={root:({instance:t})=>({position:t.$appendTo()==="self"?"relative":void 0})},Ro={root:({instance:t})=>["p-multiselect p-component p-inputwrapper",{"p-multiselect p-component p-inputwrapper":!0,"p-multiselect-display-chip":t.display==="chip","p-disabled":t.$disabled(),"p-invalid":t.invalid(),"p-variant-filled":t.$variant()==="filled","p-focus":t.focused,"p-inputwrapper-filled":t.$filled(),"p-inputwrapper-focus":t.focused||t.overlayVisible,"p-multiselect-open":t.overlayVisible,"p-multiselect-fluid":t.hasFluid,"p-multiselect-sm p-inputfield-sm":t.size()==="small","p-multiselect-lg p-inputfield-lg":t.size()==="large"}],labelContainer:"p-multiselect-label-container",label:({instance:t})=>({"p-multiselect-label":!0,"p-placeholder":t.label()===t.placeholder(),"p-multiselect-label-empty":!t.placeholder()&&!t.defaultLabel&&(!t.modelValue()||t.modelValue().length===0)}),chipItem:"p-multiselect-chip-item",pcChip:"p-multiselect-chip",chipIcon:"p-multiselect-chip-icon",dropdown:"p-multiselect-dropdown",loadingIcon:"p-multiselect-loading-icon",dropdownIcon:"p-multiselect-dropdown-icon",overlay:"p-multiselect-overlay p-component-overlay p-component",header:"p-multiselect-header",pcFilterContainer:"p-multiselect-filter-container",pcFilter:"p-multiselect-filter",listContainer:"p-multiselect-list-container",list:"p-multiselect-list",optionGroup:"p-multiselect-option-group",option:({instance:t})=>({"p-multiselect-option":!0,"p-multiselect-option-selected":t.selected&&t.highlightOnSelect,"p-disabled":t.disabled,"p-focus":t.focused}),emptyMessage:"p-multiselect-empty-message",clearIcon:"p-multiselect-clear-icon"},Pe=(()=>{class t extends se{name="multiselect";style=Po;classes=Ro;inlineStyles=No;static \u0275fac=(()=>{let e;return function(i){return(e||(e=z(t)))(i||t)}})();static \u0275prov=le({token:t,factory:t.\u0275fac})}return t})();var oi=new q("MULTISELECT_INSTANCE"),Ho=new q("MULTISELECT_ITEM_INSTANCE"),zo={provide:Le,useExisting:xe(()=>Re),multi:!0},Qo=(()=>{class t extends Ve{$pcMultiSelectItem=k(Ho,{optional:!0,skipSelf:!0})??void 0;hostName="MultiSelect";getPTOptions(e){return this.ptm(e,{context:{selected:this.selected,focused:this.focused,disabled:this.disabled}})}option;selected;label;disabled;itemSize;focused;ariaPosInset;ariaSetSize;variant;template;checkIconTemplate;itemCheckboxIconTemplate;highlightOnSelect;onClick=new V;onMouseEnter=new V;_componentStyle=k(Pe);onOptionClick(e){this.onClick.emit({originalEvent:e,option:this.option,selected:this.selected}),e.stopPropagation(),e.preventDefault()}onOptionMouseEnter(e){this.onMouseEnter.emit({originalEvent:e,option:this.option,selected:this.selected})}static \u0275fac=(()=>{let e;return function(i){return(e||(e=z(t)))(i||t)}})();static \u0275cmp=Q({type:t,selectors:[["li","pMultiSelectItem",""]],hostAttrs:["role","option"],hostVars:12,hostBindings:function(n,i){n&1&&v("click",function(a){return i.onOptionClick(a)})("mouseenter",function(a){return i.onOptionMouseEnter(a)}),n&2&&(I("aria-label",i.label)("aria-setsize",i.ariaSetSize)("aria-posinset",i.ariaPosInset)("aria-selected",i.selected)("data-p-focused",i.focused)("data-p-highlight",i.selected)("data-p-disabled",i.disabled)("aria-checked",i.selected),m(i.cx("option")),me("height",i.itemSize,"px"))},inputs:{option:"option",selected:[2,"selected","selected",x],label:"label",disabled:[2,"disabled","disabled",x],itemSize:[2,"itemSize","itemSize",X],focused:[2,"focused","focused",x],ariaPosInset:"ariaPosInset",ariaSetSize:"ariaSetSize",variant:"variant",template:"template",checkIconTemplate:"checkIconTemplate",itemCheckboxIconTemplate:"itemCheckboxIconTemplate",highlightOnSelect:[2,"highlightOnSelect","highlightOnSelect",x]},outputs:{onClick:"onClick",onMouseEnter:"onMouseEnter"},features:[Z([Pe]),W],attrs:Mi,decls:4,vars:12,consts:[["icon",""],[3,"ngModel","binary","tabindex","variant","ariaLabel","pt"],[4,"ngIf"],[4,"ngTemplateOutlet","ngTemplateOutletContext"]],template:function(n,i){n&1&&(d(0,"p-checkbox",1),u(1,Di,3,0,"ng-container",2),p(),u(2,Pi,2,1,"span",2)(3,Ni,1,0,"ng-container",3)),n&2&&(r("ngModel",i.selected)("binary",!0)("tabindex",-1)("variant",i.variant)("ariaLabel",i.label)("pt",i.getPTOptions("pcOptionCheckbox")),c(),r("ngIf",i.itemCheckboxIconTemplate),c(),r("ngIf",!i.template),c(),r("ngTemplateOutlet",i.template)("ngTemplateOutletContext",P(10,li,i.option)))},dependencies:[U,ge,ee,Ue,Ke,ye,Qe,N],encapsulation:2})}return t})(),Re=(()=>{class t extends De{zone;filterService;overlayService;id;ariaLabel;styleClass;panelStyle;panelStyleClass;inputId;readonly;group;filter=!0;filterPlaceHolder;filterLocale;overlayVisible=!1;tabindex=0;dataKey;ariaLabelledBy;set displaySelectedLabel(e){this._displaySelectedLabel=e}get displaySelectedLabel(){return this._displaySelectedLabel}set maxSelectedLabels(e){this._maxSelectedLabels=e||0}get maxSelectedLabels(){return this._maxSelectedLabels}selectionLimit;selectedItemsLabel;showToggleAll=!0;emptyFilterMessage="";emptyMessage="";resetFilterOnHide=!1;dropdownIcon;chipIcon;optionLabel;optionValue;optionDisabled;optionGroupLabel="label";optionGroupChildren="items";showHeader=!0;filterBy;scrollHeight="200px";lazy=!1;virtualScroll;loading=!1;virtualScrollItemSize;loadingIcon;virtualScrollOptions;overlayOptions;ariaFilterLabel;filterMatchMode="contains";tooltip="";tooltipPosition="right";tooltipPositionStyle="absolute";tooltipStyleClass;autofocusFilter=!1;display="comma";autocomplete="off";showClear=!1;autofocus;set placeholder(e){this._placeholder.set(e)}get placeholder(){return this._placeholder.asReadonly()}get options(){return this._options()}set options(e){at(this._options(),e)||this._options.set(e||[])}get filterValue(){return this._filterValue()}set filterValue(e){this._filterValue.set(e)}get selectAll(){return this._selectAll}set selectAll(e){this._selectAll=e}focusOnHover=!0;filterFields;selectOnFocus=!1;autoOptionFocus=!1;highlightOnSelect=!0;size=J();variant=J();fluid=J(void 0,{transform:x});appendTo=J(void 0);onChange=new V;onFilter=new V;onFocus=new V;onBlur=new V;onClick=new V;onClear=new V;onPanelShow=new V;onPanelHide=new V;onLazyLoad=new V;onRemove=new V;onSelectAllChange=new V;overlayViewChild;filterInputChild;focusInputViewChild;itemsViewChild;scroller;lastHiddenFocusableElementOnOverlay;firstHiddenFocusableElementOnOverlay;headerCheckboxViewChild;footerFacet;headerFacet;_componentStyle=k(Pe);bindDirectiveInstance=k(L,{self:!0});searchValue;searchTimeout;_selectAll=null;_placeholder=B(void 0);_disableTooltip=!1;value;_filteredOptions;focus;filtered;itemTemplate;groupTemplate;loaderTemplate;headerTemplate;filterTemplate;footerTemplate;emptyFilterTemplate;emptyTemplate;selectedItemsTemplate;loadingIconTemplate;filterIconTemplate;removeTokenIconTemplate;chipIconTemplate;clearIconTemplate;dropdownIconTemplate;itemCheckboxIconTemplate;headerCheckboxIconTemplate;templates;_itemTemplate;_groupTemplate;_loaderTemplate;_headerTemplate;_filterTemplate;_footerTemplate;_emptyFilterTemplate;_emptyTemplate;_selectedItemsTemplate;_loadingIconTemplate;_filterIconTemplate;_removeTokenIconTemplate;_chipIconTemplate;_clearIconTemplate;_dropdownIconTemplate;_itemCheckboxIconTemplate;_headerCheckboxIconTemplate;$variant=K(()=>this.variant()||this.config.inputStyle()||this.config.inputVariant());$appendTo=K(()=>this.appendTo()||this.config.overlayAppendTo());$pcMultiSelect=k(oi,{optional:!0,skipSelf:!0})??void 0;pcFluid=k(bt,{optional:!0,host:!0,skipSelf:!0});get hasFluid(){return this.fluid()??!!this.pcFluid}onAfterContentInit(){this.templates.forEach(e=>{switch(e.getType()){case"item":this._itemTemplate=e.template;break;case"group":this._groupTemplate=e.template;break;case"selectedItems":case"selecteditems":this._selectedItemsTemplate=e.template;break;case"header":this._headerTemplate=e.template;break;case"filter":this._filterTemplate=e.template;break;case"emptyfilter":this._emptyFilterTemplate=e.template;break;case"empty":this._emptyTemplate=e.template;break;case"footer":this._footerTemplate=e.template;break;case"loader":this._loaderTemplate=e.template;break;case"headercheckboxicon":this._headerCheckboxIconTemplate=e.template;break;case"loadingicon":this._loadingIconTemplate=e.template;break;case"filtericon":this._filterIconTemplate=e.template;break;case"removetokenicon":this._removeTokenIconTemplate=e.template;break;case"clearicon":this._clearIconTemplate=e.template;break;case"dropdownicon":this._dropdownIconTemplate=e.template;break;case"itemcheckboxicon":this._itemCheckboxIconTemplate=e.template;break;case"chipicon":this._chipIconTemplate=e.template;break;default:this._itemTemplate=e.template;break}})}headerCheckboxFocus;filterOptions;preventModelTouched;focused=!1;itemsWrapper;_displaySelectedLabel=!0;_maxSelectedLabels=3;modelValue=B(null);_filterValue=B(null);_options=B([]);startRangeIndex=B(-1);focusedOptionIndex=B(-1);selectedOptions;clickInProgress=!1;get emptyMessageLabel(){return this.emptyMessage||this.config.getTranslation(oe.EMPTY_MESSAGE)}get emptyFilterMessageLabel(){return this.emptyFilterMessage||this.config.getTranslation(oe.EMPTY_FILTER_MESSAGE)}get isVisibleClearIcon(){return this.modelValue()!=null&&this.modelValue()!==""&&ie(this.modelValue())&&this.showClear&&!this.$disabled()&&!this.readonly&&this.$filled()}get toggleAllAriaLabel(){return this.config.translation.aria?this.config.translation.aria[this.allSelected()?"selectAll":"unselectAll"]:void 0}get listLabel(){return this.config.getTranslation(oe.ARIA).listLabel}getAllVisibleAndNonVisibleOptions(){return this.group?this.flatOptions(this.options):this.options||[]}visibleOptions=K(()=>{let e=this.getAllVisibleAndNonVisibleOptions(),n=rt(e)&&wt.isObject(e[0]);if(this._filterValue()){let i;if(n?i=this.filterService.filter(e,this.searchFields(),this._filterValue(),this.filterMatchMode,this.filterLocale):i=e.filter(o=>o.toString().toLocaleLowerCase().includes(this._filterValue().toLocaleLowerCase())),this.group){let o=this.options||[],a=[];return o.forEach(_=>{let ve=this.getOptionGroupChildren(_).filter(_i=>i.includes(_i));ve.length>0&&a.push(qe(Ge({},_),{[typeof this.optionGroupChildren=="string"?this.optionGroupChildren:"items"]:[...ve]}))}),this.flatOptions(a)}return i}return e});label=K(()=>{let e,n=this.modelValue();if(n&&n?.length&&this.displaySelectedLabel){if(ie(this.maxSelectedLabels)&&n?.length>(this.maxSelectedLabels||0))return this.getSelectedItemsLabel();e="";for(let i=0;i<n.length;i++)i!==0&&(e+=", "),e+=this.getLabelByValue(n[i])}else e=this.placeholder()||"";return e});chipSelectedItems=K(()=>ie(this.maxSelectedLabels)&&this.modelValue()&&this.modelValue()?.length>(this.maxSelectedLabels||0)?this.modelValue()?.slice(0,this.maxSelectedLabels):this.modelValue());constructor(e,n,i){super(),this.zone=e,this.filterService=n,this.overlayService=i,et(()=>{let o=this.modelValue(),a=this.getAllVisibleAndNonVisibleOptions();a&&ie(a)&&(this.optionValue&&this.optionLabel&&o?this.selectedOptions=a.filter(_=>o.includes(_[this.optionLabel])||o.includes(_[this.optionValue])):this.selectedOptions=o,this.cd.markForCheck())})}onInit(){this.id=this.id||ct("pn_id_"),this.autoUpdateModel(),this.filterBy&&(this.filterOptions={filter:e=>this.onFilterInputChange(e),reset:()=>this.resetFilter()})}maxSelectionLimitReached(){return this.selectionLimit&&this.modelValue()&&this.modelValue().length===this.selectionLimit}onAfterViewInit(){this.overlayVisible&&this.show()}onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"])),this.filtered&&(this.zone.runOutsideAngular(()=>{setTimeout(()=>{this.overlayViewChild?.alignOverlay()},1)}),this.filtered=!1)}flatOptions(e){return(e||[]).reduce((n,i,o)=>{n.push({optionGroup:i,group:!0,index:o});let a=this.getOptionGroupChildren(i);return a&&a.forEach(_=>n.push(_)),n},[])}autoUpdateModel(){if(this.selectOnFocus&&this.autoOptionFocus&&!this.hasSelectedOption()){this.focusedOptionIndex.set(this.findFirstFocusedOptionIndex());let e=this.getOptionValue(this.visibleOptions()[this.focusedOptionIndex()]);this.onOptionSelect({originalEvent:null,option:[e]})}}updateModel(e,n){this.value=e,this.onModelChange(e),this.writeValue(e)}onInputClick(e){e.stopPropagation(),e.preventDefault(),this.focusedOptionIndex.set(-1)}onOptionSelect(e,n=!1,i=-1){let{originalEvent:o,option:a}=e;if(this.$disabled()||this.isOptionDisabled(a))return;let _=this.isSelected(a),S=[];_?S=this.modelValue().filter(ve=>!fe(ve,this.getOptionValue(a),this.equalityKey()||"")):S=[...this.modelValue()||[],this.getOptionValue(a)],this.updateModel(S,o),i!==-1&&this.focusedOptionIndex.set(i),n&&te(this.focusInputViewChild?.nativeElement),this.onChange.emit({originalEvent:e,value:S,itemValue:a})}findSelectedOptionIndex(){return this.hasSelectedOption()?this.visibleOptions().findIndex(e=>this.isValidSelectedOption(e)):-1}onOptionSelectRange(e,n=-1,i=-1){if(n===-1&&(n=this.findNearestSelectedOptionIndex(i,!0)),i===-1&&(i=this.findNearestSelectedOptionIndex(n)),n!==-1&&i!==-1){let o=Math.min(n,i),a=Math.max(n,i),_=this.visibleOptions().slice(o,a+1).filter(S=>this.isValidOption(S)).map(S=>this.getOptionValue(S));this.updateModel(_,e)}}searchFields(){return(this.filterBy||this.optionLabel||"label").split(",")}findNearestSelectedOptionIndex(e,n=!1){let i=-1;return this.hasSelectedOption()&&(n?(i=this.findPrevSelectedOptionIndex(e),i=i===-1?this.findNextSelectedOptionIndex(e):i):(i=this.findNextSelectedOptionIndex(e),i=i===-1?this.findPrevSelectedOptionIndex(e):i)),i>-1?i:e}findPrevSelectedOptionIndex(e){let n=this.hasSelectedOption()&&e>0?be(this.visibleOptions().slice(0,e),i=>this.isValidSelectedOption(i)):-1;return n>-1?n:-1}findFirstFocusedOptionIndex(){let e=this.findFirstSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e}findFirstOptionIndex(){return this.visibleOptions().findIndex(e=>this.isValidOption(e))}findFirstSelectedOptionIndex(){return this.hasSelectedOption()?this.visibleOptions().findIndex(e=>this.isValidSelectedOption(e)):-1}findNextSelectedOptionIndex(e){let n=this.hasSelectedOption()&&e<this.visibleOptions().length-1?this.visibleOptions().slice(e+1).findIndex(i=>this.isValidSelectedOption(i)):-1;return n>-1?n+e+1:-1}equalityKey(){return this.optionValue?null:this.dataKey}hasSelectedOption(){return ie(this.modelValue())}isValidSelectedOption(e){return this.isValidOption(e)&&this.isSelected(e)}isOptionGroup(e){return e&&(this.group||this.optionGroupLabel)&&e.optionGroup&&e.group}isValidOption(e){return e&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))}isOptionDisabled(e){return this.maxSelectionLimitReached()&&!this.isSelected(e)?!0:this.optionDisabled?ne(e,this.optionDisabled):e&&e.disabled!==void 0?e.disabled:!1}isSelected(e){let n=this.getOptionValue(e);return(this.modelValue()||[]).some(i=>fe(i,n,this.equalityKey()||""))}isOptionMatched(e){return this.isValidOption(e)&&this.getOptionLabel(e).toString().toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue?.toLocaleLowerCase(this.filterLocale))}isEmpty(){return!this._options()||this.visibleOptions()&&this.visibleOptions().length===0}getOptionIndex(e,n){return this.virtualScrollerDisabled?e:n&&n.getItemOptions(e).index}getAriaPosInset(e){return(this.optionGroupLabel?e-this.visibleOptions().slice(0,e).filter(n=>this.isOptionGroup(n)).length:e)+1}get ariaSetSize(){return this.visibleOptions().filter(e=>!this.isOptionGroup(e)).length}getLabelByValue(e){let i=(this.group?this.flatOptions(this._options()):this._options()||[]).find(o=>!this.isOptionGroup(o)&&fe(this.getOptionValue(o),e,this.equalityKey()||""));return i?this.getOptionLabel(i):null}getSelectedItemsLabel(){let e=/{(.*?)}/,n=this.selectedItemsLabel?this.selectedItemsLabel:this.config.getTranslation(oe.SELECTION_MESSAGE);return e.test(n)?n.replace(n.match(e)[0],this.modelValue().length+""):n}getOptionLabel(e){return this.optionLabel?ne(e,this.optionLabel):e&&e.label!=null?e.label:e}getOptionValue(e){return this.optionValue?ne(e,this.optionValue):!this.optionLabel&&e&&e.value!==void 0?e.value:e}getOptionGroupLabel(e){return this.optionGroupLabel?ne(e,this.optionGroupLabel):e&&e.label!=null?e.label:e}getOptionGroupChildren(e){return e?this.optionGroupChildren?ne(e,this.optionGroupChildren):e.items:[]}onKeyDown(e){if(this.$disabled()){e.preventDefault();return}let n=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Enter":case"Space":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"ShiftLeft":case"ShiftRight":this.onShiftKey();break;default:if(e.code==="KeyA"&&n){let i=this.visibleOptions().filter(o=>this.isValidOption(o)).map(o=>this.getOptionValue(o));this.updateModel(i,e),e.preventDefault();break}!n&&st(e.key)&&(!this.overlayVisible&&this.show(),this.searchOptions(e,e.key),e.preventDefault());break}}onFilterKeyDown(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e,!0);break;default:break}}onArrowLeftKey(e,n=!1){n&&this.focusedOptionIndex.set(-1)}onArrowDownKey(e){let n=this.focusedOptionIndex()!==-1?this.findNextOptionIndex(this.focusedOptionIndex()):this.findFirstFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,this.startRangeIndex(),n),this.changeFocusedOptionIndex(e,n),!this.overlayVisible&&this.show(),e.preventDefault(),e.stopPropagation()}onArrowUpKey(e,n=!1){if(e.altKey&&!n)this.focusedOptionIndex()!==-1&&this.onOptionSelect(e,this.visibleOptions()[this.focusedOptionIndex()]),this.overlayVisible&&this.hide(),e.preventDefault();else{let i=this.focusedOptionIndex()!==-1?this.findPrevOptionIndex(this.focusedOptionIndex()):this.findLastFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,i,this.startRangeIndex()),this.changeFocusedOptionIndex(e,i),!this.overlayVisible&&this.show(),e.preventDefault()}e.stopPropagation()}onHomeKey(e,n=!1){let{currentTarget:i}=e;if(n){let o=i.value.length;i.setSelectionRange(0,e.shiftKey?o:0),this.focusedOptionIndex.set(-1)}else{let o=e.metaKey||e.ctrlKey,a=this.findFirstOptionIndex();e.shiftKey&&o&&this.onOptionSelectRange(e,a,this.startRangeIndex()),this.changeFocusedOptionIndex(e,a),!this.overlayVisible&&this.show()}e.preventDefault()}onEndKey(e,n=!1){let{currentTarget:i}=e;if(n){let o=i.value.length;i.setSelectionRange(e.shiftKey?0:o,o),this.focusedOptionIndex.set(-1)}else{let o=e.metaKey||e.ctrlKey,a=this.findLastFocusedOptionIndex();e.shiftKey&&o&&this.onOptionSelectRange(e,this.startRangeIndex(),a),this.changeFocusedOptionIndex(e,a),!this.overlayVisible&&this.show()}e.preventDefault()}onPageDownKey(e){this.scrollInView(this.visibleOptions().length-1),e.preventDefault()}onPageUpKey(e){this.scrollInView(0),e.preventDefault()}onEnterKey(e){this.overlayVisible?this.focusedOptionIndex()!==-1&&(e.shiftKey?this.onOptionSelectRange(e,this.focusedOptionIndex()):this.onOptionSelect({originalEvent:e,option:this.visibleOptions()[this.focusedOptionIndex()]})):this.onArrowDownKey(e),e.preventDefault()}onEscapeKey(e){this.overlayVisible&&(this.hide(!0),e.stopPropagation(),e.preventDefault())}onTabKey(e,n=!1){if(!n)if(this.overlayVisible&&this.hasFocusableElements())te(e.shiftKey?this.lastHiddenFocusableElementOnOverlay?.nativeElement:this.firstHiddenFocusableElementOnOverlay?.nativeElement),e.preventDefault();else{if(this.focusedOptionIndex()!==-1){let i=this.visibleOptions()[this.focusedOptionIndex()];!this.isSelected(i)&&this.onOptionSelect({originalEvent:e,option:i})}this.overlayVisible&&this.hide(this.filter)}}onShiftKey(){this.startRangeIndex.set(this.focusedOptionIndex())}onContainerClick(e){if(!(this.$disabled()||this.loading||this.readonly||e.target?.isSameNode?.(this.focusInputViewChild?.nativeElement))){if(!this.overlayViewChild||!this.overlayViewChild.el.nativeElement.contains(e.target)){if(this.clickInProgress)return;this.clickInProgress=!0,setTimeout(()=>{this.clickInProgress=!1},150),this.overlayVisible?this.hide(!0):this.show(!0)}this.focusInputViewChild?.nativeElement.focus({preventScroll:!0}),this.onClick.emit(e),this.cd.detectChanges()}}onFirstHiddenFocus(e){let n=e.relatedTarget===this.focusInputViewChild?.nativeElement?ot(this.overlayViewChild?.overlayViewChild?.nativeElement,':not([data-p-hidden-focusable="true"])'):this.focusInputViewChild?.nativeElement;te(n)}onInputFocus(e){this.focused=!0;let n=this.focusedOptionIndex()!==-1?this.focusedOptionIndex():this.overlayVisible&&this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1;this.focusedOptionIndex.set(n),this.overlayVisible&&this.scrollInView(this.focusedOptionIndex()),this.onFocus.emit({originalEvent:e})}onInputBlur(e){this.focused=!1,this.onBlur.emit({originalEvent:e}),this.preventModelTouched||this.onModelTouched(),this.preventModelTouched=!1}onFilterInputChange(e){let n=e.target.value;this._filterValue.set(n),this.focusedOptionIndex.set(-1),this.onFilter.emit({originalEvent:e,filter:this._filterValue()}),!this.virtualScrollerDisabled&&this.scroller?.scrollToIndex(0),setTimeout(()=>{this.overlayViewChild?.alignOverlay()})}onLastHiddenFocus(e){let n=e.relatedTarget===this.focusInputViewChild?.nativeElement?lt(this.overlayViewChild?.overlayViewChild?.nativeElement,':not([data-p-hidden-focusable="true"])'):this.focusInputViewChild?.nativeElement;te(n)}onOptionMouseEnter(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)}onFilterBlur(e){this.focusedOptionIndex.set(-1)}onToggleAll(e){if(!(this.$disabled()||this.readonly)){if(this.selectAll!=null)this.onSelectAllChange.emit({originalEvent:e,checked:!this.allSelected()});else{let n=this.getAllVisibleAndNonVisibleOptions().filter(S=>this.isSelected(S)&&(this.optionDisabled?ne(S,this.optionDisabled):S&&S.disabled!==void 0?S.disabled:!1)),i=this.allSelected()?this.visibleOptions().filter(S=>!this.isValidOption(S)&&this.isSelected(S)):this.visibleOptions().filter(S=>this.isSelected(S)||this.isValidOption(S)),a=[...this.filter&&!this.allSelected()?this.getAllVisibleAndNonVisibleOptions().filter(S=>this.isSelected(S)&&this.isValidOption(S)):[],...n,...i].map(S=>this.getOptionValue(S)),_=[...new Set(a)];this.updateModel(_,e),(!_.length||_.length===this.getAllVisibleAndNonVisibleOptions().length)&&this.onSelectAllChange.emit({originalEvent:e,checked:!!_.length})}this.partialSelected()&&(this.selectedOptions=[],this.cd.markForCheck()),this.onChange.emit({originalEvent:e,value:this.value}),gt.focus(this.headerCheckboxViewChild?.inputViewChild?.nativeElement),this.headerCheckboxFocus=!0,e.originalEvent.preventDefault(),e.originalEvent.stopPropagation()}}changeFocusedOptionIndex(e,n){this.focusedOptionIndex()!==n&&(this.focusedOptionIndex.set(n),this.scrollInView())}get virtualScrollerDisabled(){return!this.virtualScroll}scrollInView(e=-1){let n=e!==-1?`${this.id}_${e}`:this.focusedOptionId;if(this.itemsViewChild&&this.itemsViewChild.nativeElement){let i=ke(this.itemsViewChild.nativeElement,`li[id="${n}"]`);i?i.scrollIntoView&&i.scrollIntoView({block:"nearest",inline:"nearest"}):this.virtualScrollerDisabled||setTimeout(()=>{this.virtualScroll&&this.scroller?.scrollToIndex(e!==-1?e:this.focusedOptionIndex())},0)}}get focusedOptionId(){return this.focusedOptionIndex()!==-1?`${this.id}_${this.focusedOptionIndex()}`:null}allSelected(){return this.selectAll!==null?this.selectAll:ie(this.visibleOptions())&&this.visibleOptions().every(e=>this.isOptionGroup(e)||this.isOptionDisabled(e)||this.isSelected(e))}partialSelected(){return this.selectedOptions&&this.selectedOptions.length>0&&this.selectedOptions.length<(this.options?.length||0)}show(e){this.overlayVisible=!0;let n=this.focusedOptionIndex()!==-1?this.focusedOptionIndex():this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.findSelectedOptionIndex();this.focusedOptionIndex.set(n),e&&te(this.focusInputViewChild?.nativeElement),this.cd.markForCheck()}hide(e){this.overlayVisible=!1,this.focusedOptionIndex.set(-1),this.filter&&this.resetFilterOnHide&&this.resetFilter(),this.overlayOptions?.mode==="modal"&&ft(),e&&te(this.focusInputViewChild?.nativeElement),this.cd.markForCheck()}onOverlayAnimationStart(e){if(e.toState==="visible"){if(this.itemsWrapper=ke(this.overlayViewChild?.overlayViewChild?.nativeElement,this.virtualScroll?".p-scroller":".p-multiselect-list-container"),this.virtualScroll&&this.scroller?.setContentEl(this.itemsViewChild?.nativeElement),this.options&&this.options.length)if(this.virtualScroll){let n=this.modelValue()?this.focusedOptionIndex():-1;n!==-1&&this.scroller?.scrollToIndex(n)}else{let n=ke(this.itemsWrapper,'[data-p-highlight="true"]');n&&n.scrollIntoView({block:"nearest",inline:"nearest"})}this.filterInputChild&&this.filterInputChild.nativeElement&&(this.preventModelTouched=!0,this.autofocusFilter&&this.filterInputChild.nativeElement.focus()),this.onPanelShow.emit(e)}e.toState==="void"&&(this.itemsWrapper=null,this.onModelTouched(),this.onPanelHide.emit(e))}resetFilter(){this.filterInputChild&&this.filterInputChild.nativeElement&&(this.filterInputChild.nativeElement.value=""),this._filterValue.set(null),this._filteredOptions=null}onOverlayHide(e){this.focusedOptionIndex.set(-1),this.filter&&this.resetFilterOnHide&&this.resetFilter()}close(e){this.hide(),e.preventDefault(),e.stopPropagation()}clear(e){this.value=[],this.updateModel(null,e),this.selectedOptions=[],this.onClear.emit(),this._disableTooltip=!0,e.stopPropagation()}labelContainerMouseLeave(){this._disableTooltip&&(this._disableTooltip=!1)}removeOption(e,n){let i=this.modelValue().filter(o=>!fe(o,e,this.equalityKey()||""));this.updateModel(i,n),this.onChange.emit({originalEvent:n,value:i,itemValue:e}),this.onRemove.emit({newValue:i,removed:e}),n&&n.stopPropagation()}findNextOptionIndex(e){let n=e<this.visibleOptions().length-1?this.visibleOptions().slice(e+1).findIndex(i=>this.isValidOption(i)):-1;return n>-1?n+e+1:e}findPrevOptionIndex(e){let n=e>0?be(this.visibleOptions().slice(0,e),i=>this.isValidOption(i)):-1;return n>-1?n:e}findLastSelectedOptionIndex(){return this.hasSelectedOption()?be(this.visibleOptions(),e=>this.isValidSelectedOption(e)):-1}findLastFocusedOptionIndex(){let e=this.findLastSelectedOptionIndex();return e<0?this.findLastOptionIndex():e}findLastOptionIndex(){return be(this.visibleOptions(),e=>this.isValidOption(e))}searchOptions(e,n){this.searchValue=(this.searchValue||"")+n;let i=-1,o=!1;return this.focusedOptionIndex()!==-1?(i=this.visibleOptions().slice(this.focusedOptionIndex()).findIndex(a=>this.isOptionMatched(a)),i=i===-1?this.visibleOptions().slice(0,this.focusedOptionIndex()).findIndex(a=>this.isOptionMatched(a)):i+this.focusedOptionIndex()):i=this.visibleOptions().findIndex(a=>this.isOptionMatched(a)),i!==-1&&(o=!0),i===-1&&this.focusedOptionIndex()===-1&&(i=this.findFirstFocusedOptionIndex()),i!==-1&&this.changeFocusedOptionIndex(e,i),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(()=>{this.searchValue="",this.searchTimeout=null},500),o}hasFocusableElements(){return nt(this.overlayViewChild?.overlayViewChild?.nativeElement,':not([data-p-hidden-focusable="true"])').length>0}hasFilter(){return this._filterValue()&&this._filterValue().trim().length>0}writeControlValue(e,n){this.value=e,n(e),this.cd.markForCheck()}getHeaderCheckboxPTOptions(e){return this.ptm(e,{context:{selected:this.allSelected()}})}getPTOptions(e,n,i,o){return this.ptm(o,{context:{selected:this.isSelected(e),focused:this.focusedOptionIndex()===this.getOptionIndex(i,n),disabled:this.isOptionDisabled(e)}})}static \u0275fac=function(n){return new(n||t)(Ie(We),Ie(pt),Ie(dt))};static \u0275cmp=Q({type:t,selectors:[["p-multiSelect"],["p-multiselect"],["p-multi-select"]],contentQueries:function(n,i,o){if(n&1&&(C(o,mt,5),C(o,ut,5),C(o,Ri,4),C(o,Hi,4),C(o,zi,4),C(o,Qi,4),C(o,Ki,4),C(o,Ui,4),C(o,$i,4),C(o,Gi,4),C(o,qi,4),C(o,ji,4),C(o,Wi,4),C(o,Yi,4),C(o,Zi,4),C(o,Ji,4),C(o,Xi,4),C(o,en,4),C(o,tn,4),C(o,G,4)),n&2){let a;h(a=g())&&(i.footerFacet=a.first),h(a=g())&&(i.headerFacet=a.first),h(a=g())&&(i.itemTemplate=a.first),h(a=g())&&(i.groupTemplate=a.first),h(a=g())&&(i.loaderTemplate=a.first),h(a=g())&&(i.headerTemplate=a.first),h(a=g())&&(i.filterTemplate=a.first),h(a=g())&&(i.footerTemplate=a.first),h(a=g())&&(i.emptyFilterTemplate=a.first),h(a=g())&&(i.emptyTemplate=a.first),h(a=g())&&(i.selectedItemsTemplate=a.first),h(a=g())&&(i.loadingIconTemplate=a.first),h(a=g())&&(i.filterIconTemplate=a.first),h(a=g())&&(i.removeTokenIconTemplate=a.first),h(a=g())&&(i.chipIconTemplate=a.first),h(a=g())&&(i.clearIconTemplate=a.first),h(a=g())&&(i.dropdownIconTemplate=a.first),h(a=g())&&(i.itemCheckboxIconTemplate=a.first),h(a=g())&&(i.headerCheckboxIconTemplate=a.first),h(a=g())&&(i.templates=a)}},viewQuery:function(n,i){if(n&1&&(D(nn,5),D(on,5),D(ln,5),D(an,5),D(rn,5),D(sn,5),D(cn,5),D(pn,5)),n&2){let o;h(o=g())&&(i.overlayViewChild=o.first),h(o=g())&&(i.filterInputChild=o.first),h(o=g())&&(i.focusInputViewChild=o.first),h(o=g())&&(i.itemsViewChild=o.first),h(o=g())&&(i.scroller=o.first),h(o=g())&&(i.lastHiddenFocusableElementOnOverlay=o.first),h(o=g())&&(i.firstHiddenFocusableElementOnOverlay=o.first),h(o=g())&&(i.headerCheckboxViewChild=o.first)}},hostVars:5,hostBindings:function(n,i){n&1&&v("click",function(a){return i.onContainerClick(a)}),n&2&&(I("id",i.id),$(i.sx("root")),m(i.cn(i.cx("root"),i.styleClass)))},inputs:{id:"id",ariaLabel:"ariaLabel",styleClass:"styleClass",panelStyle:"panelStyle",panelStyleClass:"panelStyleClass",inputId:"inputId",readonly:[2,"readonly","readonly",x],group:[2,"group","group",x],filter:[2,"filter","filter",x],filterPlaceHolder:"filterPlaceHolder",filterLocale:"filterLocale",overlayVisible:[2,"overlayVisible","overlayVisible",x],tabindex:[2,"tabindex","tabindex",X],dataKey:"dataKey",ariaLabelledBy:"ariaLabelledBy",displaySelectedLabel:"displaySelectedLabel",maxSelectedLabels:"maxSelectedLabels",selectionLimit:[2,"selectionLimit","selectionLimit",X],selectedItemsLabel:"selectedItemsLabel",showToggleAll:[2,"showToggleAll","showToggleAll",x],emptyFilterMessage:"emptyFilterMessage",emptyMessage:"emptyMessage",resetFilterOnHide:[2,"resetFilterOnHide","resetFilterOnHide",x],dropdownIcon:"dropdownIcon",chipIcon:"chipIcon",optionLabel:"optionLabel",optionValue:"optionValue",optionDisabled:"optionDisabled",optionGroupLabel:"optionGroupLabel",optionGroupChildren:"optionGroupChildren",showHeader:[2,"showHeader","showHeader",x],filterBy:"filterBy",scrollHeight:"scrollHeight",lazy:[2,"lazy","lazy",x],virtualScroll:[2,"virtualScroll","virtualScroll",x],loading:[2,"loading","loading",x],virtualScrollItemSize:[2,"virtualScrollItemSize","virtualScrollItemSize",X],loadingIcon:"loadingIcon",virtualScrollOptions:"virtualScrollOptions",overlayOptions:"overlayOptions",ariaFilterLabel:"ariaFilterLabel",filterMatchMode:"filterMatchMode",tooltip:"tooltip",tooltipPosition:"tooltipPosition",tooltipPositionStyle:"tooltipPositionStyle",tooltipStyleClass:"tooltipStyleClass",autofocusFilter:[2,"autofocusFilter","autofocusFilter",x],display:"display",autocomplete:"autocomplete",showClear:[2,"showClear","showClear",x],autofocus:[2,"autofocus","autofocus",x],placeholder:"placeholder",options:"options",filterValue:"filterValue",selectAll:"selectAll",focusOnHover:[2,"focusOnHover","focusOnHover",x],filterFields:"filterFields",selectOnFocus:[2,"selectOnFocus","selectOnFocus",x],autoOptionFocus:[2,"autoOptionFocus","autoOptionFocus",x],highlightOnSelect:[2,"highlightOnSelect","highlightOnSelect",x],size:[1,"size"],variant:[1,"variant"],fluid:[1,"fluid"],appendTo:[1,"appendTo"]},outputs:{onChange:"onChange",onFilter:"onFilter",onFocus:"onFocus",onBlur:"onBlur",onClick:"onClick",onClear:"onClear",onPanelShow:"onPanelShow",onPanelHide:"onPanelHide",onLazyLoad:"onLazyLoad",onRemove:"onRemove",onSelectAllChange:"onSelectAllChange"},features:[Z([zo,Pe,{provide:oi,useExisting:t},{provide:ce,useExisting:t}]),ae([L]),W],ngContentSelectors:un,decls:16,vars:46,consts:[["focusInput",""],["elseBlock",""],["overlay",""],["content",""],["token",""],["removeicon",""],["firstHiddenFocusableEl",""],["buildInItems",""],["lastHiddenFocusableEl",""],["builtInFilterElement",""],["headerCheckbox",""],["icon",""],["filterInput",""],["scroller",""],["loader",""],["items",""],[1,"p-hidden-accessible",3,"pBind"],["role","combobox",3,"focus","blur","keydown","pTooltip","tooltipPosition","positionStyle","tooltipStyleClass","pAutoFocus","pBind"],[3,"mouseleave","pBind","pTooltip","tooltipDisabled","tooltipPosition","positionStyle","tooltipStyleClass"],[3,"pBind"],[4,"ngIf"],[4,"ngIf","ngIfElse"],[3,"visibleChange","onAnimationStart","onHide","hostAttrSelector","visible","options","target","appendTo","pt"],[3,"pBind","class"],[3,"pBind","class",4,"ngFor","ngForOf"],[3,"onRemove","pt","label","removable","removeIcon"],[3,"class","pBind","click",4,"ngIf"],[3,"click","pBind"],[4,"ngTemplateOutlet","ngTemplateOutletContext"],["data-p-icon","times",3,"pBind","class","click",4,"ngIf"],[3,"pBind","class","click",4,"ngIf"],["data-p-icon","times",3,"click","pBind"],[4,"ngTemplateOutlet"],[3,"pBind","class",4,"ngIf"],[3,"pBind","class","ngClass",4,"ngIf"],["data-p-icon","chevron-down",3,"pBind","class",4,"ngIf"],[3,"pBind","ngClass"],["data-p-icon","chevron-down",3,"pBind"],[3,"pBind","ngStyle"],["role","presentation",1,"p-hidden-accessible","p-hidden-focusable",3,"focus","pBind"],[3,"items","style","itemSize","autoSize","tabindex","lazy","options","onLazyLoad",4,"ngIf"],[3,"pt","ngModel","ariaLabel","binary","variant","disabled","onChange",4,"ngIf"],[3,"pt","class",4,"ngIf"],[3,"onChange","pt","ngModel","ariaLabel","binary","variant","disabled"],["data-p-icon","check",3,"class","pBind",4,"ngIf"],["data-p-icon","check",3,"pBind"],[3,"pt"],["pInputText","","type","text","role","searchbox",3,"input","keydown","click","blur","pt","variant","value"],["data-p-icon","search",3,"pBind",4,"ngIf"],["class","p-multiselect-filter-icon",3,"pBind",4,"ngIf"],["data-p-icon","search",3,"pBind"],[1,"p-multiselect-filter-icon",3,"pBind"],[3,"onLazyLoad","items","itemSize","autoSize","tabindex","lazy","options"],["role","listbox","aria-multiselectable","true",3,"pBind"],["ngFor","",3,"ngForOf"],["role","option",3,"pBind","class","ngStyle",4,"ngIf"],["role","option",3,"pBind","ngStyle"],[3,"ngTemplateOutlet","ngTemplateOutletContext",4,"ngIf"],[3,"ngTemplateOutlet","ngTemplateOutletContext"],["pMultiSelectItem","","pRipple","",3,"onClick","onMouseEnter","pBind","id","option","selected","label","disabled","template","itemCheckboxIconTemplate","itemSize","focused","ariaPosInset","ariaSetSize","variant","highlightOnSelect","pt"]],template:function(n,i){if(n&1){let o=O();Ce(dn),d(0,"div",16)(1,"input",17,0),v("focus",function(_){return f(o),b(i.onInputFocus(_))})("blur",function(_){return f(o),b(i.onInputBlur(_))})("keydown",function(_){return f(o),b(i.onKeyDown(_))}),p()(),d(3,"div",18),v("mouseleave",function(){return f(o),b(i.labelContainerMouseLeave())}),d(4,"div",19),u(5,kn,3,2,"ng-container",20)(6,Mn,3,6,"ng-container",20),p()(),u(7,Dn,3,2,"ng-container",20),d(8,"div",19),u(9,Qn,3,2,"ng-container",21)(10,Wn,2,2,"ng-template",null,1,A),p(),d(12,"p-overlay",22,2),we("visibleChange",function(_){return f(o),Te(i.overlayVisible,_)||(i.overlayVisible=_),b(_)}),v("onAnimationStart",function(_){return f(o),b(i.onOverlayAnimationStart(_))})("onHide",function(_){return f(o),b(i.onOverlayHide(_))}),u(14,Do,13,23,"ng-template",null,3,A),p()}if(n&2){let o=Y(11);r("pBind",i.ptm("hiddenInputContainer")),I("data-p-hidden-accessible",!0),c(),r("pTooltip",i.tooltip)("tooltipPosition",i.tooltipPosition)("positionStyle",i.tooltipPositionStyle)("tooltipStyleClass",i.tooltipStyleClass)("pAutoFocus",i.autofocus)("pBind",i.ptm("hiddenInput")),I("aria-disabled",i.$disabled())("id",i.inputId)("aria-label",i.ariaLabel)("aria-labelledby",i.ariaLabelledBy)("aria-haspopup","listbox")("aria-expanded",i.overlayVisible??!1)("aria-controls",i.overlayVisible?i.id+"_list":null)("tabindex",i.$disabled()?-1:i.tabindex)("aria-activedescendant",i.focused?i.focusedOptionId:void 0)("value",i.modelValue())("name",i.name())("required",i.required()?"":void 0)("disabled",i.$disabled()?"":void 0),c(2),m(i.cx("labelContainer")),r("pBind",i.ptm("labelContainer"))("pTooltip",i.tooltip)("tooltipDisabled",i._disableTooltip)("tooltipPosition",i.tooltipPosition)("positionStyle",i.tooltipPositionStyle)("tooltipStyleClass",i.tooltipStyleClass),c(),m(i.cx("label")),r("pBind",i.ptm("label")),c(),r("ngIf",!i.selectedItemsTemplate&&!i._selectedItemsTemplate),c(),r("ngIf",i.selectedItemsTemplate||i._selectedItemsTemplate),c(),r("ngIf",i.isVisibleClearIcon),c(),m(i.cx("dropdown")),r("pBind",i.ptm("dropdown")),c(),r("ngIf",i.loading)("ngIfElse",o),c(3),r("hostAttrSelector",i.$attrSelector),Se("visible",i.overlayVisible),r("options",i.overlayOptions)("target","@parent")("appendTo",i.$appendTo())("pt",i.ptm("pcOverlay"))}},dependencies:[U,Oe,tt,ge,ee,it,Qo,Kt,N,$t,Ut,Me,yt,xt,It,vt,zt,Qt,Ae,ii,Ue,Ke,ye,Qe,Ee,L],encapsulation:2,changeDetection:0})}return t})(),si=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=de({type:t});static \u0275inj=pe({imports:[Re,N,N]})}return t})();var ci=`
    .p-toggleswitch {
        display: inline-block;
        width: dt('toggleswitch.width');
        height: dt('toggleswitch.height');
    }

    .p-toggleswitch-input {
        cursor: pointer;
        appearance: none;
        position: absolute;
        top: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        opacity: 0;
        z-index: 1;
        outline: 0 none;
        border-radius: dt('toggleswitch.border.radius');
    }

    .p-toggleswitch-slider {
        cursor: pointer;
        width: 100%;
        height: 100%;
        border-width: dt('toggleswitch.border.width');
        border-style: solid;
        border-color: dt('toggleswitch.border.color');
        background: dt('toggleswitch.background');
        transition:
            background dt('toggleswitch.transition.duration'),
            color dt('toggleswitch.transition.duration'),
            border-color dt('toggleswitch.transition.duration'),
            outline-color dt('toggleswitch.transition.duration'),
            box-shadow dt('toggleswitch.transition.duration');
        border-radius: dt('toggleswitch.border.radius');
        outline-color: transparent;
        box-shadow: dt('toggleswitch.shadow');
    }

    .p-toggleswitch-handle {
        position: absolute;
        top: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: dt('toggleswitch.handle.background');
        color: dt('toggleswitch.handle.color');
        width: dt('toggleswitch.handle.size');
        height: dt('toggleswitch.handle.size');
        inset-inline-start: dt('toggleswitch.gap');
        margin-block-start: calc(-1 * calc(dt('toggleswitch.handle.size') / 2));
        border-radius: dt('toggleswitch.handle.border.radius');
        transition:
            background dt('toggleswitch.transition.duration'),
            color dt('toggleswitch.transition.duration'),
            inset-inline-start dt('toggleswitch.slide.duration'),
            box-shadow dt('toggleswitch.slide.duration');
    }

    .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider {
        background: dt('toggleswitch.checked.background');
        border-color: dt('toggleswitch.checked.border.color');
    }

    .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.checked.background');
        color: dt('toggleswitch.handle.checked.color');
        inset-inline-start: calc(dt('toggleswitch.width') - calc(dt('toggleswitch.handle.size') + dt('toggleswitch.gap')));
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover) .p-toggleswitch-slider {
        background: dt('toggleswitch.hover.background');
        border-color: dt('toggleswitch.hover.border.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover) .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.hover.background');
        color: dt('toggleswitch.handle.hover.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover).p-toggleswitch-checked .p-toggleswitch-slider {
        background: dt('toggleswitch.checked.hover.background');
        border-color: dt('toggleswitch.checked.hover.border.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover).p-toggleswitch-checked .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.checked.hover.background');
        color: dt('toggleswitch.handle.checked.hover.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:focus-visible) .p-toggleswitch-slider {
        box-shadow: dt('toggleswitch.focus.ring.shadow');
        outline: dt('toggleswitch.focus.ring.width') dt('toggleswitch.focus.ring.style') dt('toggleswitch.focus.ring.color');
        outline-offset: dt('toggleswitch.focus.ring.offset');
    }

    .p-toggleswitch.p-invalid > .p-toggleswitch-slider {
        border-color: dt('toggleswitch.invalid.border.color');
    }

    .p-toggleswitch.p-disabled {
        opacity: 1;
    }

    .p-toggleswitch.p-disabled .p-toggleswitch-slider {
        background: dt('toggleswitch.disabled.background');
    }

    .p-toggleswitch.p-disabled .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.disabled.background');
    }
`;var Uo=["handle"],$o=["input"],Go=t=>({checked:t});function qo(t,l){t&1&&F(0)}function jo(t,l){if(t&1&&u(0,qo,1,0,"ng-container",3),t&2){let e=s();r("ngTemplateOutlet",e.handleTemplate||e._handleTemplate)("ngTemplateOutletContext",P(2,Go,e.checked()))}}var Wo=`
    ${ci}

    p-toggleswitch.ng-invalid.ng-dirty > .p-toggleswitch-slider {
        border-color: dt('toggleswitch.invalid.border.color');
    }
`,Yo={root:{position:"relative"}},Zo={root:({instance:t})=>["p-toggleswitch p-component",{"p-toggleswitch p-component":!0,"p-toggleswitch-checked":t.checked(),"p-disabled":t.$disabled(),"p-invalid":t.invalid()}],input:"p-toggleswitch-input",slider:"p-toggleswitch-slider",handle:"p-toggleswitch-handle"},pi=(()=>{class t extends se{name="toggleswitch";style=Wo;classes=Zo;inlineStyles=Yo;static \u0275fac=(()=>{let e;return function(i){return(e||(e=z(t)))(i||t)}})();static \u0275prov=le({token:t,factory:t.\u0275fac})}return t})();var di=new q("TOGGLESWITCH_INSTANCE"),Jo={provide:Le,useExisting:xe(()=>He),multi:!0},He=(()=>{class t extends De{$pcToggleSwitch=k(di,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=k(L,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}styleClass;tabindex;inputId;readonly;trueValue=!0;falseValue=!1;ariaLabel;size=J();ariaLabelledBy;autofocus;onChange=new V;input;handleTemplate;_handleTemplate;focused=!1;_componentStyle=k(pi);templates;onHostClick(e){this.onClick(e)}onAfterContentInit(){this.templates.forEach(e=>{e.getType()==="handle"?this._handleTemplate=e.template:this._handleTemplate=e.template})}onClick(e){!this.$disabled()&&!this.readonly&&(this.writeModelValue(this.checked()?this.falseValue:this.trueValue),this.onModelChange(this.modelValue()),this.onChange.emit({originalEvent:e,checked:this.modelValue()}),this.input.nativeElement.focus())}onFocus(){this.focused=!0}onBlur(){this.focused=!1,this.onModelTouched()}checked(){return this.modelValue()===this.trueValue}writeControlValue(e,n){n(e),this.cd.markForCheck()}static \u0275fac=(()=>{let e;return function(i){return(e||(e=z(t)))(i||t)}})();static \u0275cmp=Q({type:t,selectors:[["p-toggleswitch"],["p-toggleSwitch"],["p-toggle-switch"]],contentQueries:function(n,i,o){if(n&1&&(C(o,Uo,4),C(o,G,4)),n&2){let a;h(a=g())&&(i.handleTemplate=a.first),h(a=g())&&(i.templates=a)}},viewQuery:function(n,i){if(n&1&&D($o,5),n&2){let o;h(o=g())&&(i.input=o.first)}},hostVars:5,hostBindings:function(n,i){n&1&&v("click",function(a){return i.onHostClick(a)}),n&2&&(I("data-pc-name","toggleswitch"),$(i.sx("root")),m(i.cn(i.cx("root"),i.styleClass)))},inputs:{styleClass:"styleClass",tabindex:[2,"tabindex","tabindex",X],inputId:"inputId",readonly:[2,"readonly","readonly",x],trueValue:"trueValue",falseValue:"falseValue",ariaLabel:"ariaLabel",size:[1,"size"],ariaLabelledBy:"ariaLabelledBy",autofocus:[2,"autofocus","autofocus",x]},outputs:{onChange:"onChange"},features:[Z([Jo,pi,{provide:di,useExisting:t},{provide:ce,useExisting:t}]),ae([L]),W],decls:5,vars:20,consts:[["input",""],["type","checkbox","role","switch",3,"focus","blur","checked","pAutoFocus","pBind"],[3,"pBind"],[4,"ngTemplateOutlet","ngTemplateOutletContext"]],template:function(n,i){if(n&1){let o=O();d(0,"input",1,0),v("focus",function(){return f(o),b(i.onFocus())})("blur",function(){return f(o),b(i.onBlur())}),p(),d(2,"div",2)(3,"div",2),R(4,jo,1,4,"ng-container"),p()()}n&2&&(m(i.cx("input")),r("checked",i.checked())("pAutoFocus",i.autofocus)("pBind",i.ptm("input")),I("id",i.inputId)("required",i.required()?"":void 0)("disabled",i.$disabled()?"":void 0)("aria-checked",i.checked())("aria-labelledby",i.ariaLabelledBy)("aria-label",i.ariaLabel)("name",i.name())("tabindex",i.tabindex),c(2),m(i.cx("slider")),r("pBind",i.ptm("slider")),c(),m(i.cx("handle")),r("pBind",i.ptm("handle")),c(),H(i.handleTemplate||i._handleTemplate?4:-1))},dependencies:[U,ee,Me,N,Ee,L],encapsulation:2,changeDetection:0})}return t})(),ui=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=de({type:t});static \u0275inj=pe({imports:[He,N,N]})}return t})();var el=()=>({width:"min(46rem, 96vw)"});function tl(t,l){t&1&&(d(0,"tr")(1,"th"),y(2,"Usuario"),p(),d(3,"th"),y(4,"Roles"),p(),d(5,"th"),y(6,"Estado"),p(),d(7,"th",26),y(8,"Acciones"),p()())}function il(t,l){if(t&1&&E(0,"p-tag",28),t&2){let e=l.$implicit,n=s(2);r("value",n.roleLabel(e))}}function nl(t,l){if(t&1){let e=O();d(0,"tr")(1,"td")(2,"strong"),y(3),p()(),d(4,"td")(5,"div",27),Ze(6,il,1,1,"p-tag",28,Ye),p()(),d(8,"td"),E(9,"p-tag",29),p(),d(10,"td",26)(11,"button",30),v("click",function(){let i=f(e).$implicit,o=s();return b(o.openEdit(i))}),p()()()}if(t&2){let e=l.$implicit;c(3),M(e.username),c(3),Je(e.roles),c(3),r("value",e.active?"Activo":"Inactivo")("severity",e.active?"success":"danger")}}function ol(t,l){if(t&1&&(d(0,"small"),y(1),p()),t&2){let e=s();c(),M(e.controlError("username"))}}function ll(t,l){if(t&1&&(d(0,"small"),y(1),p()),t&2){let e=s();c(),M(e.controlError("password"))}}function al(t,l){if(t&1&&(d(0,"small"),y(1),p()),t&2){let e=s();c(),M(e.controlError("roles"))}}var mi=class t{usersApi=k(Vt);notificationService=k(ht);fb=k(Dt);users=B([]);loading=B(!1);saving=B(!1);editingUser=B(null);dialogVisible=!1;roleOptions=Object.keys(Fe).map(l=>({value:l,label:Fe[l]}));activeCount=K(()=>this.users().filter(l=>l.active).length);distinctRoles=K(()=>Array.from(new Set(this.users().flatMap(l=>l.roles))));form=this.fb.nonNullable.group({username:["",[Be.required]],password:["",[Be.minLength(8)]],roles:[[],[Be.required]],active:[!0]});ngOnInit(){this.loadUsers()}loadUsers(){this.loading.set(!0),this.usersApi.getUsers().pipe(ze(1)).subscribe({next:l=>{this.users.set(l),this.loading.set(!1)},error:()=>{this.loading.set(!1)}})}openCreate(){this.editingUser.set(null),this.form.reset({username:"",password:"",roles:["RECEPCION"],active:!0}),this.dialogVisible=!0}openEdit(l){this.editingUser.set(l),this.form.reset({username:l.username,password:"",roles:[...l.roles],active:l.active}),this.dialogVisible=!0}submit(){if(this.form.invalid){this.form.markAllAsTouched();return}let l=this.form.getRawValue(),e={username:l.username.trim(),password:l.password.trim()?l.password.trim():null,roles:l.roles,active:l.active};if(!this.editingUser()&&!e.password){this.form.controls.password.setErrors({required:!0}),this.form.controls.password.markAsTouched();return}this.saving.set(!0),(this.editingUser()?this.usersApi.updateUser(this.editingUser().id,e):this.usersApi.createUser(e)).pipe(ze(1)).subscribe({next:()=>{this.saving.set(!1),this.dialogVisible=!1,this.resetForm(),this.notificationService.success("Usuarios",this.editingUser()?"Usuario actualizado.":"Usuario creado."),this.loadUsers()},error:i=>{this.saving.set(!1),Yt(this.form,_t(i.error))}})}resetForm(){this.editingUser.set(null),this.form.reset({username:"",password:"",roles:[],active:!0})}roleLabel(l){return Fe[l]}showControlError(l){let e=this.form.controls[l];return e.invalid&&e.touched}controlError(l){let e=this.form.controls[l];return e.errors?.server?e.errors.server:e.errors?.required?"Este campo es obligatorio.":e.errors?.minlength?"Debe tener al menos 8 caracteres.":"Valor invalido."}static \u0275fac=function(e){return new(e||t)};static \u0275cmp=Q({type:t,selectors:[["app-users-page"]],decls:64,vars:26,consts:[[1,"space-y-8"],["eyebrow","Administracion","title","Usuarios","subtitle","Gestion de usuarios del gateway sin modificar contratos ni seguridad del backend."],["header-actions",""],["pButton","","type","button","icon","pi pi-plus","label","Nuevo usuario",3,"click"],[1,"summary-grid"],[1,"summary-card"],[1,"surface-card","space-y-8"],[1,"app-toolbar"],[1,"m-0"],[1,"text-slate-500"],[1,"app-toolbar__actions"],["pButton","","type","button","icon","pi pi-refresh","label","Recargar","severity","secondary","variant","outlined",3,"click","loading"],["responsiveLayout","scroll",3,"value","loading","paginator","rows"],["pTemplate","header"],["pTemplate","body"],[3,"visibleChange","onHide","visible","modal","draggable","header"],[1,"space-y-8",3,"ngSubmit","formGroup"],[1,"form-grid"],[1,"field"],["pInputText","","type","text","formControlName","username"],["formControlName","password","fluid","",3,"feedback","toggleMask"],["formControlName","roles","optionLabel","label","optionValue","value","display","chip","placeholder","Selecciona roles",3,"options"],["formControlName","active"],[1,"flex","justify-end","gap-3"],["pButton","","type","button","label","Cancelar","severity","secondary","variant","text",3,"click"],["pButton","","type","submit",3,"label","loading"],[1,"text-right"],[1,"flex","flex-wrap","gap-2"],["severity","info",3,"value"],[3,"value","severity"],["pButton","","type","button","icon","pi pi-pen-to-square","label","Editar","size","small","severity","secondary","variant","outlined",3,"click"]],template:function(e,n){e&1&&(d(0,"div",0)(1,"app-page-header",1)(2,"div",2)(3,"button",3),v("click",function(){return n.openCreate()}),p()()(),d(4,"section",4)(5,"article",5)(6,"span"),y(7,"Total usuarios"),p(),d(8,"strong"),y(9),p(),d(10,"small"),y(11,"Registros visibles desde /auth/users"),p()(),d(12,"article",5)(13,"span"),y(14,"Usuarios activos"),p(),d(15,"strong"),y(16),p(),d(17,"small"),y(18,"Disponibles para iniciar sesion"),p()(),d(19,"article",5)(20,"span"),y(21,"Roles configurados"),p(),d(22,"strong"),y(23),p(),d(24,"small"),y(25),p()()(),d(26,"section",6)(27,"div",7)(28,"div")(29,"h3",8),y(30,"Listado de usuarios"),p(),d(31,"small",9),y(32,"Alta y edicion sobre el gateway actual."),p()(),d(33,"div",10)(34,"button",11),v("click",function(){return n.loadUsers()}),p()()(),d(35,"p-table",12),u(36,tl,9,0,"ng-template",13)(37,nl,12,3,"ng-template",14),p()()(),d(38,"p-dialog",15),we("visibleChange",function(o){return Te(n.dialogVisible,o)||(n.dialogVisible=o),o}),v("onHide",function(){return n.resetForm()}),d(39,"form",16),v("ngSubmit",function(){return n.submit()}),d(40,"div",17)(41,"label",18)(42,"span"),y(43,"Usuario"),p(),E(44,"input",19),R(45,ol,2,1,"small"),p(),d(46,"label",18)(47,"span"),y(48),p(),E(49,"p-password",20),R(50,ll,2,1,"small"),p()(),d(51,"div",17)(52,"label",18)(53,"span"),y(54,"Roles"),p(),E(55,"p-multiselect",21),R(56,al,2,1,"small"),p(),d(57,"label",18)(58,"span"),y(59,"Activo"),p(),E(60,"p-toggleswitch",22),p()(),d(61,"div",23)(62,"button",24),v("click",function(){return n.dialogVisible=!1}),p(),E(63,"button",25),p()()()),e&2&&(c(9),M(n.users().length),c(7),M(n.activeCount()),c(7),M(n.distinctRoles().length),c(2),M(n.distinctRoles().join(", ")||"Sin roles"),c(9),r("loading",n.loading()),c(),r("value",n.users())("loading",n.loading())("paginator",!0)("rows",8),c(3),$(_e(25,el)),Se("visible",n.dialogVisible),r("modal",!0)("draggable",!1)("header",n.editingUser()?"Editar usuario":"Crear usuario"),c(),r("formGroup",n.form),c(6),H(n.showControlError("username")?45:-1),c(3),re("Contrasena ",n.editingUser()?"(opcional)":""),c(),r("feedback",!1)("toggleMask",!0),c(),H(n.showControlError("password")?50:-1),c(5),r("options",n.roleOptions),c(),H(n.showControlError("roles")?56:-1),c(7),r("label",n.editingUser()?"Guardar cambios":"Crear usuario")("loading",n.saving()))},dependencies:[U,Pt,Lt,Mt,ye,Ft,Bt,At,Tt,St,G,kt,Ot,Nt,Ae,si,Re,Et,Ht,Rt,qt,Gt,Wt,jt,ui,He],encapsulation:2})};export{mi as UsersPageComponent};
