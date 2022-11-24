// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useWallet } from '@mysten/wallet-adapter-react';
import { WalletWrapper } from '@mysten/wallet-adapter-react-ui';
import clsx from 'clsx';
import { z } from 'zod';

import type { SuiMoveNormalizedFunction, ObjectId } from '@mysten/sui.js';

import { useZodForm } from '~/hooks/useZodForm';
import { Button } from '~/ui/Button';
import { DisclosureBox } from '~/ui/DisclosureBox';

const argsSchema = z.object({
    params: z.array(z.string().trim().min(1)),
});

export type ModuleFunctionProps = {
    packageId: ObjectId;
    moduleName: string;
    functionName: string;
    functionDetails: SuiMoveNormalizedFunction;
    defaultOpen?: boolean;
};

export function ModuleFunction({
    defaultOpen,
    packageId,
    moduleName,
    functionName,
    functionDetails,
}: ModuleFunctionProps) {
    const { connected } = useWallet();
    const { register, handleSubmit, formState } = useZodForm(argsSchema);
    const isExecuteDisabled =
        formState.isValidating ||
        !formState.isValid ||
        formState.isSubmitting ||
        !connected;
    return (
        <DisclosureBox defaultOpen={defaultOpen} title={functionName}>
            <form
                onSubmit={handleSubmit(({ params }) => {
                    console.log({
                        params,
                        connected,
                        isValid: formState.isValid,
                    });
                })}
                autoComplete="off"
                className="flex flex-col flex-nowrap items-stretch gap-3.75"
            >
                {functionDetails.parameters.map((paramType, index) => {
                    const paramId = [
                        packageId,
                        moduleName,
                        functionName,
                        'param',
                        index,
                    ].join('_');
                    return (
                        <div
                            key={paramId}
                            className="flex flex-col flex-nowrap items-stretch gap-2.5"
                        >
                            <label
                                htmlFor={paramId}
                                className="text-bodySmall font-medium text-steel-darker ml-2.5"
                            >
                                arg_{index}
                            </label>
                            <input
                                id={paramId}
                                {...register(`params.${index}`)}
                                placeholder={JSON.stringify(paramType)}
                                className="p-2 text-steel-darker text-body font-medium bg-white border-gray-45 border border-solid rounded-md shadow-sm shadow-[#1018280D] placeholder:text-gray-60"
                            />
                        </div>
                    );
                })}
                <div className="flex items-center justify-end gap-1.5">
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isExecuteDisabled}
                    >
                        Execute
                    </Button>
                    <div className={clsx('temp-ui-override', { connected })}>
                        <WalletWrapper />
                    </div>
                </div>
            </form>
        </DisclosureBox>
    );
}
