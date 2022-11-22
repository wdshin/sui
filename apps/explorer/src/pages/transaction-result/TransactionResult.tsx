// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
    getExecutionStatusType,
    getTotalGasUsed,
    getExecutionStatusError,
} from '@mysten/sui.js';
import * as Sentry from '@sentry/react';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import ErrorResult from '../../components/error-result/ErrorResult';
import theme from '../../styles/theme.module.css';
import { IS_STATIC_ENV } from '../../utils/envUtil';
import { findDataFromID } from '../../utils/static/searchUtil';
import { type DataType } from './TransactionResultType';
import TransactionView from './TransactionView';

import type {
    TransactionEffects,
    SuiObjectRef,
    SuiTransactionWithAuthSignersResponse,
} from '@mysten/sui.js';

import { useRpc } from '~/hooks/useRpc';

// TODO: update state to include Call types
// TODO: clean up duplicate fields
const initState: DataType = {
    transaction: null,
    signers: [],
    loadState: 'pending',
    txId: '',
    data: {
        transactions: [],
        sender: '',
        gasPayment: { digest: '', objectId: '', version: 0 },
        gasBudget: 0,
    },
    transactionDigest: '',
    txSignature: '',
    authSignInfo: {
        epoch: 0,
        signature: [],
    },
    status: 'success',
    gasFee: 0,
    txError: '',
    timestamp_ms: 0,
    mutated: [],
    created: [],
    events: [],
};

const getCreatedOrMutatedData = (
    txEffects: TransactionEffects,
    contentType: 'created' | 'mutated'
): SuiObjectRef[] => {
    return contentType in txEffects && txEffects[contentType] != null
        ? txEffects[contentType]!.map((item) => item.reference)
        : [];
};

function FailedToGetTxResults({ id }: { id: string }) {
    return (
        <ErrorResult
            id={id}
            errorMsg={
                !id
                    ? "Can't search for a transaction without a digest"
                    : 'Data could not be extracted for the following specified transaction ID'
            }
        />
    );
}

const transformTransactionResponse = (
    txObj: SuiTransactionWithAuthSignersResponse,
    id: string
): DataType => {
    return {
        ...txObj.tx_response.certificate,
        transaction: txObj.tx_response,
        signers: txObj.signers,
        status: getExecutionStatusType(txObj.tx_response)!,
        gasFee: getTotalGasUsed(txObj.tx_response)!,
        txError: getExecutionStatusError(txObj.tx_response) ?? '',
        txId: id,
        loadState: 'loaded',
        mutated: getCreatedOrMutatedData(txObj.tx_response.effects, 'mutated'),
        created: getCreatedOrMutatedData(txObj.tx_response.effects, 'created'),
        events: txObj.tx_response.effects.events,
        timestamp_ms: txObj.tx_response.timestamp_ms,
    };
};

function TransactionResultAPI({ id }: { id: string }) {
    const [showTxState, setTxState] = useState(initState);
    const rpc = useRpc();
    useEffect(() => {
        if (id == null) {
            return;
        }

        rpc.getTransactionWithAuthSigners(id)
            .then((txObj) => {
                setTxState(transformTransactionResponse(txObj, id));
            })
            .catch((err) => {
                console.log('Error fetching transaction data', err);
                setTxState({
                    ...initState,
                    loadState: 'fail',
                });
            });
    }, [id, rpc]);

    // TODO update Loading screen
    if (showTxState.loadState === 'pending') {
        return (
            <div className={theme.textresults}>
                <div>Loading...</div>
            </div>
        );
    }
    if (id && showTxState.loadState === 'loaded') {
        return <TransactionView txdata={showTxState} />;
    }
    // For Batch transactions show error
    // TODO update Error screen and account for Batch transactions

    return <FailedToGetTxResults id={id} />;
}

const TransactionResultStatic = ({ id }: { id: string }) => {
    const entry = findDataFromID(id, undefined);
    try {
        return (
            <TransactionView txdata={transformTransactionResponse(entry, id)} />
        );
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        return <FailedToGetTxResults id={id} />;
    }
};

function TransactionResult() {
    const { id } = useParams();
    const { state } = useLocation();

    const checkStateHasData = (
        state: any
    ): state is { data: SuiTransactionWithAuthSignersResponse } => {
        return state !== null && 'data' in state;
    };

    const checkIsString = (value: any): value is string =>
        typeof value === 'string';

    if (checkStateHasData(state) && id) {
        return (
            <TransactionView
                txdata={transformTransactionResponse(state.data, id)}
            />
        );
    }

    if (checkIsString(id)) {
        return IS_STATIC_ENV ? (
            <TransactionResultStatic id={id} />
        ) : (
            <TransactionResultAPI id={id} />
        );
    }

    return <ErrorResult id={id} errorMsg="ID not a valid string" />;
}

export default TransactionResult;
