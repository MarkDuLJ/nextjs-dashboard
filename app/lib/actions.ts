'use server'

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from 'zod'

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error:"please select a customer"
    }),
    amount: z.coerce.number().gt(0,{
        message:"amount should be greater than $0"
    }),
    status: z.enum(['pending', 'paid'],{
        invalid_type_error:"please select an invoice status"
    }),
    date: z.string(),
})

export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };

const CreateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(prevState:State,formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    // console.log(validatedFields);
    
    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message:"Missing fiels, failed to create invoice."
        }
    }

    const {amount, customerId, status} = validatedFields.data
    const amountInCents = amount * 100
    const date = new Date().toISOString().split('T')[0]

    // after validation, insert valid data in to database
    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `
    } catch (error) {
        // only handle database errors.
        return {
            message: "DB error: failed to create invoice"
        }
    }

    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });


export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData
    ) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message:"Missing fields, failed to update invoice."
        }
    }

    const {amount, customerId, status} = validatedFields.data
    const amountInCents = amount * 100;

    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        return {
            message: "DB error: failed to update invoice"
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    // throw error before anything
    throw  new Error("unable to touch invoice")
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: "Invoice deleted"}
    } catch (error) {
        return {
            message: "DB error: failed to delete invoice"
        }
    }
}